import React, {useEffect, useRef, useState} from "react";
import {createLogger, log_info, log_warning} from "./Logger";
import {SocketAdaptor} from "./Socket";
import {RemoteMessage} from "./Messages";
import {HTTPRestAdaptor, RestAdaptor} from "./RestAdaptor";

// const host: RestAdaptor = new HTTPRestAdaptor("coco.abamaxa.com");
const host: RestAdaptor = new HTTPRestAdaptor();

createLogger(host);

const App = () => {

  const [currentVideo, setCurrentVideo] = useState("");
  const videoControlRef = useRef(null);

  const togglePause = (vc: HTMLVideoElement) => {
    if (vc.paused) {
      vc.play().catch(err => {
        log_warning(err.message);
      })
    } else {
      vc.pause();
    }
  };

  useEffect(() => {

    new SocketAdaptor(
      () => new WebSocket(`ws://${host.getHost()}/remote/ws`),
      (message: RemoteMessage) => {
        log_info(`Got message: ${message}`);
        if (message.Play !== undefined) {
          log_info(`Got play message: ${message.Play.url}`);
          const url = `http://${host.getHost()}${message.Play.url}`;
          setCurrentVideo(url);

        } else if (message.Seek !== undefined && videoControlRef !== null) {
          const vc = videoControlRef.current as unknown as HTMLVideoElement;
          vc.currentTime = vc.currentTime + message.Seek.interval;

        } else if (message.TogglePause !== undefined && videoControlRef !== null) {
          const vc = videoControlRef.current as unknown as HTMLVideoElement;
          togglePause(vc);
        }
      }
    );

  }, [])

  const getNextVideo = (_: React.SyntheticEvent<HTMLVideoElement>) => {
    log_info("getNextVideo called");
  }

  if (currentVideo !== "") {
    return (
      <div className="bg-black h-screen w-screen">
        <video
          className="h-screen m-auto"
          onEnded={e => getNextVideo(e)}
          onClick={e => togglePause(e.currentTarget)}
          style={{objectFit: "contain"}}
          id="video"
          autoPlay={true}
          controls
          muted={false}
          playsInline={false}
          src={currentVideo}
          ref={videoControlRef}
        >
        </video>
      </div>
    )
  } else {
    return (
      <h1 className="text-6xl text-white bg-black text-center h-screen py-32">
        Waiting for video to be selected
      </h1>
    )
  }
};

export default App;
