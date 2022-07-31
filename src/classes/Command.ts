import type { Widgets } from "blessed";

export default class Command {
  constructor(public name: string, public execute: ExecuteFunctionType) {}
}

export type ExecuteFunctionType = (chatLog: Widgets.Log) => unknown;
