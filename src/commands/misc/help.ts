import chalk from "chalk";
import Command from "../../classes/Command";
import syncGlob from "glob";
import { promisify } from "util";
import path from "path";

const glob = promisify(syncGlob);

export default new Command(
  {
    name: "help",
    description: "Shows this help message",
  },
  async (chatLog) => {
    const commands: Command[] = [];

    const commandFiles = await glob(
      path.join(__dirname, "../../commands/**/*.js")
    );

    for (const file of commandFiles) {
      const command = await import(file);
      commands.push(command.default);
    }

    chatLog.log(
      chalk`{bgGreen CMD}: {bold Help Menu} | {green ${commands.length}} commands`
    );
    for (const command of commands) {
      chatLog.log(
        chalk`{bgGreen CMD}: {bold /${command.opts.name}} ${command.opts.description}`
      );
    }
  }
);
