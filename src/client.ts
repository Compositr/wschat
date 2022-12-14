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
import setup from "./blessed/setup";

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

  const screen = blessed.screen({
    title: `WSChat ${CONSTANTS.VERSION}`,
    smartCSR: true,
    dockBorders: true,
  });

  const { chatLog, msgInput, connectionBox, addressBox } = await setup({
    screen,
  });

  const commands = new Map<string, Command>();

  const commandFiles = await glob(path.join(__dirname, "./commands/**/*.js"));
  for (const file of commandFiles) {
    const command = await import(file);
    commands.set(command.default.opts.name, command.default);
  }

  if (!config.has("saw_gpl")) {
    chatLog.log(
      chalk`{bgCyan WSChat} is licensed under the {yellow GNU General Public License version 3.0}`
    );
    config.set("saw_gpl", 1);
  }

  msgInput.key("enter", async () => {
    const text = msgInput.getValue().trim();
    if (!text) {
      msgInput.clearValue();
      msgInput.focus();
      return;
    }
    chatLog.log(`{right}${text} <-{/right}`);
    if (text.startsWith("/")) {
      chatLog.log(chalk`{bgGreen CMD}: Command received`);
      if (text.startsWith(`/nick`)) {
        name = text.split(" ")[1];
        config.set("name", name);
        chatLog.log(
          chalk`{bgGreen CMD}: Nickname set to {green ${name}} and save in config file`
        );
      }

      const cmd = commands.get(text.split(" ")[0].replace("/", ""));
      if (!cmd) chatLog.log(chalk`{bgRed CMD}: Command not found`);
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
      connectionBox.setContent(chalk`{green Connected to} {magenta self}`);
      return chatLog.log(chalk`--> {magenta CLIENT}: Connected to self`);
    }
    chatLog.log(chalk`--> {magenta CLIENT}: Connected to server`);
    connectionBox.setContent(chalk`{green Connected to} {dim ${address}}`);
  });

  socket.on("disconnect", () => {
    connectionBox.setContent(chalk`{red Disconnected}`);
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
