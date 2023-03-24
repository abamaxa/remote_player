import {log_error} from "./Logger";

export interface RestAdaptor {
  get: <T>(path: string) => Promise<T>;
  delete: (path: string) => Promise<Response>;
  post: <T>(path: string, payload: T) => Promise<Response>;
  getHost: () => string | null;
}


export class HTTPRestAdaptor implements RestAdaptor {
  private readonly host?: string;

  constructor(host?: string) {
    this.host = host || window.location.host;
  }

  getHost = (): string | null => {
    return this.host !== undefined ? this.host : null;
  }

  get = async <T>(path: string): Promise<T> => {
    const response = await fetch(this.makeUrl(path));
    return await response.json();
  }

  post = async <T>(path: string, payload: T): Promise<Response> => {
    const params = {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json'
      }
    }

    return fetch(this.makeUrl(path), params);
  }

  delete = async(path: string): Promise<Response> => {
    return fetch(this.makeUrl(path), { method: 'DELETE' });
  }

  makeUrl = (path: string): string => {
    if (this.host !== undefined) {
      return `http://${this.host}/${path}`;
    }
    return `/${path}`;
  }
}