import blessed from "blessed";
import io from "socket.io-client";
import socketio from "socket.io";
import WSEvents from "./enums/WSEvents";
import http from "http";
import chalk from "chalk";
import type Message from "./types/messages/Message";
import type Command from "./classes/Command";
import syncGlob from "glob"
import { promisify } from "util";
import path from "path";

const glob = promisify(syncGlob);

export default async function (name: string, address?: string) {
  const server = http.createServer();
  const ioserver = new socketio.Server(server);
  const commands = new Map<string, Command>();

  const commandFiles = await glob(path.join(__dirname, "commands/**/*.js"));
  for (const file of commandFiles) {
    const command = await import(file);
    commands.set(command.default.name, command.default);
  }

  const screen = blessed.screen({
    title: "WSChat",
    smartCSR: true,
  });

  const chatBox = blessed.box({
    label: "Messages",
    width: "100%",
    height: "100%-6",
    border: {
      type: "line",
    },
  });

  const chatLog = blessed.log({
    parent: chatBox,
    tags: true,
    scrollable: true,
    alwaysScroll: true,
    mouse: true,
  });

  const inputBox = blessed.box({
    label: "Send",
    bottom: 3,
    width: "100%",
    height: 3,
    border: {
      type: "line",
    },
  });

  const msgInput = blessed.textbox({
    parent: inputBox,
    inputOnFocus: true,
  });

  const statusBox = blessed.text({
    label: "Status",
    bottom: 0,
    width: "49%",
    height: 3,
    border: {
      type: "line",
    },
    left: 0,
    fg: "#fff",
  });

  const addressBox = blessed.text({
    label: "Server Address",
    bottom: 0,
    width: "49%",
    height: 3,
    border: {
      type: "line",
    },
    right: 0,
  });

  msgInput.key("enter", () => {
    const text = msgInput.getValue();
    chatLog.log(`{right}${text} <-{/right}`);
    if (text.startsWith("/")) {
      if (text.startsWith(`/nick`)) {
        name = text.split(" ")[1];
      }

      const cmd = commands.get(text.split(" ")[0].replace("/", ""));
      cmd?.execute(chatLog);

      msgInput.clearValue();
      msgInput.focus();
      return;
    }
    socket.emit(WSEvents.MESSAGE, {
      content: text,
      author: name,
    } as Message);

    msgInput.clearValue();
    msgInput.focus();
  });

  msgInput.key(["C-c"], () => process.exit(0));

  screen.append(chatBox);
  screen.append(inputBox);
  screen.append(statusBox);
  screen.append(addressBox);

  screen.render();

  msgInput.focus();

  server.listen(process.env.PORT ?? 0, () => {
    chatLog.log(
      chalk`--> {cyan SERVER}: Listening on port {green ${
        (server.address() as any)?.port
      }}`
    );

    addressBox.setContent(
      chalk`ws://${
        (server.address() as any)?.family === "IPv4"
          ? (server.address() as any)?.address
          : `[${(server.address() as any)?.address}]`
      }:${(server.address() as any)?.port}`
    );
  });

  // cb logic

  const socket = io(
    address ?? `ws://localhost:${(server.address() as any)?.port}`
  );

  socket.on(WSEvents.MESSAGE, (msg: Message) => {
    chatLog.log(`-> ${msg.author}: ${msg.content}`);
  });

  socket.on("connect", () => {
    if (!address) {
      statusBox.setContent(chalk`{green Connected to} {magenta self}`);
      return chatLog.log(
        chalk`--> {magenta CLIENT}: Connected to self. Previous peer was self.`
      );
    }
    chatLog.log(chalk`--> {magenta CLIENT}: Connected to server`);
    statusBox.setContent(chalk`{green Connected to} {dim ${address}}`);
  });

  socket.on("disconnect", () => {
    statusBox.setContent(chalk`{red Disconnected}`);
    chatLog.log(chalk`--> {magenta CLIENT}: Disconnected from server`);
  });

  socket.on(WSEvents.NEW_PEER, () => {
    chatLog.log(chalk`--> {bgMagenta PEER}: New peer connected`);
  });

  ioserver.on("connection", (sock) => {
    sock.on(WSEvents.MESSAGE, (msg: Message) => {
      sock.broadcast.emit(WSEvents.MESSAGE, msg);
    });

    sock.broadcast.emit(WSEvents.NEW_PEER);
  });
}
