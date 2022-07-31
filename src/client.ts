import blessed from "blessed";
import io from "socket.io-client";
import socketio from "socket.io";
import WSEvents from "./enums/WSEvents";
import http from "http";
import chalk from "chalk";
import type Message from "./types/messages/Message";
import type Command from "./classes/Command";
import syncGlob from "glob";
import { promisify } from "util";
import path from "path";
import Conf from "conf/dist/source";
import type UserStats from "./types/stats/UserStats";
import CONSTANTS from "./CONSTANTS.json";
import axios from "axios";
import gt from "semver/functions/gt";

const glob = promisify(syncGlob);
const config = new Conf({
  configName: `wschatconfigv1`,
  projectName: "wschat",
});

let name = config.get("name") ?? "Unnamed";

export default async function (address?: string) {
  const server = http.createServer();
  const ioserver = new socketio.Server(server, {
    maxHttpBufferSize: 1000000,
  });
  const commands = new Map<string, Command>();

  const commandFiles = await glob(path.join(__dirname, "commands/**/*.js"));
  for (const file of commandFiles) {
    const command = await import(file);
    commands.set(command.default.opts.name, command.default);
  }

  const screen = blessed.screen({
    title: "WSChat",
    smartCSR: true,
    dockBorders: true,
  });

  const titleBox = blessed.box({
    top: 0,
    height: 3,
    border: {
      type: "line",
    },
    align: "center",
    hoverText: `Created with ❤ by Compositr`,
  });

  titleBox.setContent(chalk`{bgCyan WSChat} ${CONSTANTS.VERSION}`);

  const chatBox = blessed.box({
    label: "Messages",
    width: "100%",
    top: 3,
    height: "100%-9",
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

  msgInput.key("enter", async () => {
    const text = msgInput.getValue().trim();
    if (!text) {
      msgInput.clearValue();
      msgInput.focus();
      return;
    }
    chatLog.log(`{right}${text} <-{/right}`);
    if (text.startsWith("/")) {
      if (text.startsWith(`/nick`)) {
        name = text.split(" ")[1];
        config.set("name", name);
        chatLog.log(
          chalk`{bgGreen CMD}: Nickname set to {green ${name}} and save in config file`
        );
      }

      const cmd = commands.get(text.split(" ")[0].replace("/", ""));
      await cmd?.execute(chatLog, socket as any, ioserver);

      msgInput.clearValue();
      msgInput.focus();
      return;
    }
    socket.emit(WSEvents.MESSAGE, {
      content: text,
      author: name,
      timestamp: Date.now(),
    } as Message);

    msgInput.clearValue();
    msgInput.focus();
  });

  msgInput.key(["C-c"], () => process.exit(0));

  screen.append(titleBox);
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
    chatLog.log(
      // Don't indent the string below. just dont
      chalk`
{dim ${new Date(msg.timestamp).toLocaleString()}} 
-> ${msg.author}: ${msg.content}`
    );
  });

  socket.on("connect", () => {
    if (!address) {
      statusBox.setContent(chalk`{green Connected to} {magenta self}`);
      return chatLog.log(chalk`--> {magenta CLIENT}: Connected to self`);
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

    sock.on(WSEvents.STATS_USERS, (cb) => {
      cb({
        users: ioserver.engine.clientsCount,
      } as UserStats);
    });

    sock.broadcast.emit(WSEvents.NEW_PEER);
  });

  /**
   * Check for updates
   */
  const remoteConstants = await axios.get(CONSTANTS.UPDATE_URL);
  if (gt(remoteConstants.data.VERSION, CONSTANTS.VERSION)) {
    chatLog.log(chalk`{bgRed SYSTEM}: New version available!`);
    const prompt = blessed.box({
      align: "center",
      border: {
        type: "line",
      },
      content: chalk`
{bold New version available!}

{yellow ${CONSTANTS.VERSION}} --> {green ${remoteConstants.data.VERSION}}

{dim Auto-dismissing in 3 seconds...}
      `,
    });

    screen.append(prompt);
    prompt.focus();
    screen.render();

    setTimeout(() => {
      prompt.destroy();
      screen.render();
    }, 3_000);
  }
}
