import React from "react";
import {createLogger} from "./Logger";
import {HTTPRestAdaptor, RestAdaptor} from "./RestAdaptor";
import Viewer from "./Viewer";

const host: RestAdaptor = new HTTPRestAdaptor("localhost");

createLogger(host);

const App = () => {
  return (<Viewer host={host}/>);
};

export default App;
