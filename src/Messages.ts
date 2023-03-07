export interface PlayRequest {
  url: string;
}

export interface RemoteMessage {

  Play? : PlayRequest;

  Stop?: string;

  TogglePause?: string;

  Command?: {command: string};

  Seek?: {interval: number};
}
