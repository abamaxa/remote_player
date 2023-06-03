/**
 * Contains functions for communicating with a remote server and handling messages received via WebSocket.
 */
import {log_info, log_error} from "./Logger";
import {string} from "prop-types";
import {RemoteMessage} from "./Messages";

/**
 * The type of function callback that executes when a message is received from the server.
 */
type onMessageCallback = ((message: RemoteMessage) => void);

/**
 * A singleton class that acts as an Adaptor for a WebSocket that
 * communicates with a remote server.
 */
export class SocketAdaptor {
  /** The single instance of SocketAdaptor */
  private static _instance: SocketAdaptor;
  /** The function that creates and returns a WebSocket */
  private static socketBuilder: (() => WebSocket) | undefined;
  /** The WebSocket instance being managed */
  private socket?: WebSocket = undefined;
  /** The flag indicating whether the WebSocket connection is open */
  private open: boolean = false;
  /** The flag indicating whether WebSocket message listeners have been added */
  private listening: boolean = false;
  /** The callback that executes when a message is received from the server */
  private readonly onMessage?: onMessageCallback = undefined;

  /**
   * Constructs a new instance of SocketAdaptor.
   * @param socketBuilder - A function that creates and returns a WebSocket.
   * @param onMessage - A callback that executes when a message is received from the server.
   */
  constructor(socketBuilder: () => WebSocket, onMessage: onMessageCallback) {
    // Ensure only one instance exists.
    if (SocketAdaptor._instance) {
      return SocketAdaptor._instance;
    }
    SocketAdaptor._instance = this;

    // Initialize properties.
    SocketAdaptor.socketBuilder = socketBuilder;
    this.onMessage = onMessage;
    this.socket = socketBuilder();
    this.addListeners();
  }

  /**
   * Adds listeners for WebSocket open and message events.
   */
  addListeners = () => {
    if (this.socket !== undefined && !this.listening) {
      this.listening = true;
      const self = this;

      // Sends a message when the WebSocket is opened.
      this.socket.onopen = () => {
        console.log("open websocket event");
        if (self.socket !== undefined) {
          self.open = true;
          self.send({SendLastState: null});
        }
      };

      this.socket.onerror = (error) => {
        console.log(`WebSocket encountered error: ${JSON.stringify(error)}, closing socket`);
        setTimeout(self._reconnect, 1000);
      };

      // Parses a message when one is received.
      this.socket.onmessage = (event) => {
        self.onReceive(event).catch(err => log_info(`onReceive exception: ${err}`));
      }
    }
  }

  /**
   * Closes the WebSocket connection.
   * @param code - A numeric value representing the code for closing the connection.
   * @param reason - A reason for closing the connection.
   */
  close = (code?: number | undefined, reason?: string | undefined) => {
    if (this.socket !== undefined) {
      try {
        this.socket.close(code, reason);
      } catch {
        // ignore any errors from attempting to close the socket.
      }

      this.socket = undefined;
      this.open = false;
      this.listening = false;
    }
  }

  /**
   * Sends a string to the remote server.
   * @param message - The message to send.
   */
  send_string = (message: string) => {
    if (this.socket !== undefined && this.open) {
      this.socket.send(message);
    }
  }

  /**
   * Sends a message to the remote server.
   * @param message - The message to send.
   */
  send = <T,>(message: T) => {
    if (this.socket !== undefined && this.open) {
      // Serialize the object as a JSON string
      const jsonString = JSON.stringify(message);

      // Convert the JSON string to a Blob
      const blob = new Blob([jsonString], { type: "application/json" });

      if (this.socket.readyState > 1) {
        this._reconnect();
      }

      try {
        this.socket.send(blob);
      } catch (error) {
        this._reconnect();
        this.socket.send(blob);
      }
    }
  }

  /**
   * Parses a message received from the server.
   * @param event - The event containing the message.
   */
  onReceive = async (event: any) => {
    if (this.socket !== undefined && this.open && this.onMessage !== undefined) {
      if (event.data instanceof string) {
        // Log message.
        log_info(event.data);
      } else {
        // Parse received message.
        await this._parseMessage(event);
      }
    }
  }

  /**
   * Parses a message received from the server.
   * @param event - The event to parse.
   */
  _parseMessage = async (event: any)=> {
    try {
      // Convert response to text.
      const txt = await new Response(event.data).text();
      // Parse JSON data.
      let data = JSON.parse(txt);
      // Execute callback with parsed data.
      this.onMessage!(data);
    } catch (error) {
      // Log and throw error.
      log_error(`error ${error}, received unexpected message: ${event.data}`);
      //throw error;
    }
  }

  /**
   * Returns true if the WebSocket is open and ready for communication.
   * @return - A boolean indicating if the WebSocket is open.
   */
  isReady = ():boolean => {
    return (this.socket !== undefined && this.open);
  }

  _reconnect = () => {
    if (SocketAdaptor.socketBuilder) {
      try {
        this.close();
        this.socket = SocketAdaptor.socketBuilder();
        this.addListeners();
      } catch (error) {
        console.log(`reconnecting websocket: ${error}`);
      }
    }
  }
}