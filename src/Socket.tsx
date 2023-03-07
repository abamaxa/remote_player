import {log_info} from "./Logger";
import {string} from "prop-types";
import {RemoteMessage} from "./Messages";


type onMessageCallback = ((message: RemoteMessage) => void);

export class SocketAdaptor {
  private static _instance: SocketAdaptor;
  private static socketBuilder: (() => WebSocket) | undefined;
  private socket?: WebSocket = undefined;
  private open: boolean = false;
  private listening: boolean = false;
  private readonly onMessage?: onMessageCallback = undefined;

  constructor(socketBuilder: () => WebSocket, onMessage: onMessageCallback) {
    if (SocketAdaptor._instance) {
      return SocketAdaptor._instance;
    }
    SocketAdaptor._instance = this;
    SocketAdaptor.socketBuilder = socketBuilder;

    this.onMessage = onMessage;
    this.socket = socketBuilder();
    this.addListeners();
  }

  addListeners = () => {
    if (this.socket !== undefined && !this.listening) {

      this.listening = true;
      const self = this;

      this.socket.addEventListener('open', (_) => {
        console.log("open websocket event");
        if (self.socket !== undefined) {
          self.socket.send('Hello Server!');
        }

        self.open = true;
      });

      this.socket.addEventListener('message', function (event) {
        self.onReceive(event).catch(err => log_info(`onReceive exception: ${err}`));
      });
    }
  }

  close = (code?: number | undefined, reason?: string | undefined) => {
    if (this.socket !== undefined) {
      this.socket.close(code, reason);
      this.socket = undefined;
      this.open = false;
      this.listening = false;
    }
  }

  send = (message: string | Blob) => {
    if (this.socket !== undefined && this.open) {
      this.socket.send(message);
    }
  }

  onReceive = async (event: any) => {
    if (this.socket !== undefined && this.open && this.onMessage !== undefined) {
      if (event.data instanceof string) {
        log_info(event.data);
      } else {
        const txt = await new Response(event.data).text();
        log_info(`onReceive: ${txt}`);
        let data = JSON.parse(txt);
        log_info(`onReceive: ${data} -> ${this.onMessage}`);
        this.onMessage(data);
      }
    }
  }

  isReady = ():boolean => {
    return (this.socket !== undefined && this.open);
  }
}
