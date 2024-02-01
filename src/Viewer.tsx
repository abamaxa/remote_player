import React, {useEffect, useRef, useState} from "react";
import {log_info, log_warning} from "./Logger";
import {SocketAdaptor} from "./Socket";
import {PlayRequest, RemoteMessage, RemotePlayerState} from "./Messages";
import {RestAdaptor} from "./RestAdaptor";

type VideoControlProps = {
  host: RestAdaptor;
}

const Viewer = (props: VideoControlProps) => {

  const [socket, setSocket] = useState<SocketAdaptor | null>(null);
  const [currentVideo, setCurrentVideo] = useState<PlayRequest>();
  const videoControlRef = useRef(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line no-restricted-globals
    const host = props.host.getHost() ? props.host.getHost() : location.host;
    const _socket = new SocketAdaptor(
      () => new WebSocket(`ws://${host}/api/remote/ws`),
      (message: RemoteMessage) => {
        if (message.Play !== undefined) {
          message.Play.url = message.Play.url.replace("/stream/", "/alt-stream/").replace("/api/", `http://${host}/api/`);
          setCurrentVideo(message.Play);
        } else if (message.Seek !== undefined && videoControlRef !== null) {
          const vc = videoControlRef.current as unknown as HTMLVideoElement;
          vc.currentTime = vc.currentTime + message.Seek.interval;

        } else if (message.TogglePause !== undefined && videoControlRef !== null) {
          const vc = videoControlRef.current as unknown as HTMLVideoElement;
          togglePause(vc);
        }
      }
    );

    setSocket(_socket);

  }, [props.host]);

  const togglePause = (vc: HTMLVideoElement) => {
    if (vc.paused) {
      vc.play().catch(err => {
        log_warning(err.message);
      })
    } else {
      vc.pause();
    }
  };

  const getNextVideo = (_: React.SyntheticEvent<HTMLVideoElement>) => {
    log_info("getNextVideo called");
  }

  const logVideoError = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const error = (e.target as HTMLVideoElement).error;
    if (error) {
      log_info(`Video error: ${error.message}`);
    }
  }

  const onTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (socket !== null && currentVideo !== undefined) {
      const player = e.currentTarget as HTMLVideoElement;
      socket.send({State: new RemotePlayerState(player, currentVideo.collection, currentVideo.video)});
    }
  }

  useEffect(() => {
    const resizeVideo = () => {
      if (currentVideo && currentVideo.width && currentVideo.height && videoContainerRef.current) {
        const videoAspectRatio = currentVideo.aspectWidth / currentVideo.aspectHeight;
        const screenAspectRatio = window.innerWidth / window.innerHeight;
    
        if (screenAspectRatio > videoAspectRatio) {
          // Screen is wider than the video (letterboxing)
          videoContainerRef.current.style.width = `${(videoAspectRatio / screenAspectRatio) * 100}vw`;
          videoContainerRef.current.style.height = '100vh';
        } else {
          // Screen is taller than the video (pillarboxing)
          videoContainerRef.current.style.height = `${(screenAspectRatio / videoAspectRatio) * 100}vh`;
          videoContainerRef.current.style.width = '100vw';
        }
      }
    }

    window.addEventListener('resize', resizeVideo);

    resizeVideo();

    return () => {
      window.removeEventListener('resize', resizeVideo);
    }
  }, [currentVideo]);
  
  if (currentVideo !== undefined) {
    return (
      <div className="bg-black h-screen w-screen flex justify-center items-center" style={{ padding: 0, margin: 0 }}>
        <div 
          ref={videoContainerRef} 
          className="flex justify-center items-center"
          style={{ position: 'relative', width: '100%', height: '100%', padding: 0, margin: 0 }}
        >
          <video
            className="outline-0"
            style={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)', 
              maxWidth: '100%', 
              maxHeight: '100%', 
              objectFit: 'fill',
              width: '100%', 
              height: '100%' 
            }}
            onEnded={e => getNextVideo(e)}
            onError={e => logVideoError(e)}
            onTimeUpdate={e => onTimeUpdate(e)}
            id="video"
            autoPlay={true}
            controls
            muted={false}
            playsInline={false}
            src={currentVideo.url}
            ref={videoControlRef}
          >
          </video>
        </div>
      </div>
    )
  } else {
    return (
      <div className="bg-black h-screen w-screen flex justify-center items-center">
        <div className="bg-black p-1 mx-auto overflow-y-auto text-2xl text-white">
          <h1>Coming Soon...</h1>
        </div>
      </div>
    )
  }
};

export default Viewer;

/*
  useEffect(() => {
    const resizeVideo = () => {
      if (currentVideo && currentVideo.width && currentVideo.height && videoContainerRef.current) {
        const videoAspectRatio = currentVideo.width / currentVideo.height;
        const screenAspectRatio = window.innerWidth / window.innerHeight;
    
        if (screenAspectRatio > videoAspectRatio) {
          // Screen is wider than the video (letterboxing)
          videoContainerRef.current.style.width = '100vw' // `${(videoAspectRatio / screenAspectRatio) * 125}vw`;
          videoContainerRef.current.style.height = '100vh';
        } else {
          // Screen is taller than the video (pillarboxing)
          videoContainerRef.current.style.height = '100vh'; //`${(screenAspectRatio / videoAspectRatio) * 100}vh`;
          videoContainerRef.current.style.width = '100vw';
        }
      }
    }

    window.addEventListener('resize', resizeVideo);

    resizeVideo();

    return () => {
      window.removeEventListener('resize', resizeVideo);
    }
  }, [currentVideo]);
  
  if (currentVideo !== undefined) {
    return (
      <div className="bg-black h-screen w-screen flex justify-center items-center" style={{ padding: 0, margin: 0 }}>
      <div 
        ref={videoContainerRef} 
        className="flex justify-center items-center"
        style={{ position: 'relative', width: '100%', height: '100%', padding: 0, margin: 0 }}
      >
        <video
          className="outline-0"
          style={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)', 
            maxWidth: '100%', 
            maxHeight: '100%', 
            objectFit: 'contain',
            width: '100%', 
            height: '100%' 
          }}
            onEnded={e => getNextVideo(e)}
            onError={e => logVideoError(e)}
            onTimeUpdate={e => onTimeUpdate(e)}
            id="video"
            autoPlay={true}
            controls
            muted={false}
            playsInline={false}
            src={currentVideo.url}
            ref={videoControlRef}
          >
          </video>
        </div>
      </div>
    )
  } else {
    return (
      <div className="bg-black h-screen w-screen flex justify-center items-center">
        <div className="bg-black p-1 mx-auto overflow-y-auto text-2xl text-white">
          <h1>Coming Soon...</h1>
        </div>
      </div>
    )
  }


*/