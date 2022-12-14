import type { Widgets } from "blessed";
import type { Server } from "socket.io";
import type { Socket } from "socket.io-client";

export default class Command {
  constructor(public opts: CommandOptions, public execute: ExecuteFunctionType) {}
}

export type ExecuteFunctionType = (
  chatLog: Widgets.Log,
  socket: Socket,
  socketio: Server
) => unknown;

export interface CommandOptions {
  name: string,
  description: string
}