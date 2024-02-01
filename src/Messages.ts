/**
 * Represents a request for audio or video playback.
 *
 * @interface
 */
export interface PlayRequest {
  url: string; // The URL to audio or video media.
  collection: string;
  video: string;
  width: number; // The width of the video.
  height: number; // The height of the video. 
  aspectWidth: number; // The width of the video.
  aspectHeight: number; // The height of the video.
}

/**
 * Represents a message that can be sent from the remote server.
 *
 * @interface
 */
export interface RemoteMessage {
  Play?: PlayRequest; // A PlayRequest used to request audio or video playback.
  Stop?: string; // Request audio or video stop.
  TogglePause?: string; // Toggle audio or video pause.
  Command?: {command: string}; // A string command that can be sent to a remote server.
  Seek?: {interval: number}; // An interval of time that can be sent to seek audio or video playback.
  State?: RemotePlayerState;
  Error?: string;
  SendLastState?: string;
}

/**
 * Represents a message that can be sent to a remote server.
 *
 * @interface
 */
export class RemotePlayerState {
  readonly currentTime: number;
  readonly duration: number;
  readonly currentSrc: string;
  readonly collection: string;
  readonly video: string;

  constructor(player: HTMLVideoElement, collection: string, video: string) {
    this.currentTime = player.currentTime;
    this.duration = player.duration;
    this.currentSrc = player.currentSrc;
    this.collection = collection;
    this.video = video;
  }
}
