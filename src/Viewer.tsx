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

  useEffect(() => {
    // eslint-disable-next-line no-restricted-globals
    const host = props.host.getHost() ? props.host.getHost() : location.host;
    const _socket = new SocketAdaptor(
      () => new WebSocket(`ws://${host}/api/remote/ws`),
      (message: RemoteMessage) => {
        if (message.Play !== undefined) {
          message.Play.url = message.Play.url.replace("/stream/", "/alt-stream/");
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

  if (currentVideo !== undefined) {
    // onClick={e => onClick(e)}
    return (
        <div className="bg-black h-screen w-screen">
          <video
            className="m-auto w-full h-screen object-contain outline-0"
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
    )
  } else {
    return (
      <div className="bg-black h-screen w-screen flex">
        <div className="p-1 mx-auto overflow-y-auto text-2xl text-white">
          <h1>Coming Soon...</h1>
        </div>
      </div>
    )
  }
};

export default Viewer;