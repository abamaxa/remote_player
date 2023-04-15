import React, {useEffect, useRef, useState} from "react";
import {createLogger, log_info, log_warning} from "./Logger";
import {SocketAdaptor} from "./Socket";
import {RemoteMessage} from "./Messages";
import {HTTPRestAdaptor, RestAdaptor} from "./RestAdaptor";

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
        if (message.Play !== undefined) {
          log_info(`Got play message: ${message.Play.url}`);

          let url: string;
          if (message.Play.url.startsWith("http")) {
            // hacky fix for samsung tvs
            url = message.Play.url.replace("\/stream\/", "/alt-stream/");
          } else {
            url = `http://${host.getHost()}${message.Play.url}`;
          }
          setCurrentVideo(url);

        } else if (message.Seek !== undefined && videoControlRef !== null) {
          const vc = videoControlRef.current as unknown as HTMLVideoElement;
          vc.currentTime = vc.currentTime + message.Seek.interval;

        } else if (message.TogglePause !== undefined && videoControlRef !== null) {
          const vc = videoControlRef.current as unknown as HTMLVideoElement;
          togglePause(vc);
        } else {
          log_warning(`Got unknown message: ${message}`);
        }
      }
    );

  }, [])

  const getNextVideo = (_: React.SyntheticEvent<HTMLVideoElement>) => {
    log_info("getNextVideo called");
  }

  const logVideoError = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const error = (e.target as HTMLVideoElement).error;
    if (error) {
      log_info(`Video error: ${error.message}`);
    }
  }

  if (currentVideo !== "") {
    return (
      <div className="bg-black h-screen w-screen">
        <video
          className="h-screen m-auto"
          onEnded={e => getNextVideo(e)}
          onClick={e => togglePause(e.currentTarget)}
          onError={e => logVideoError(e)}
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
