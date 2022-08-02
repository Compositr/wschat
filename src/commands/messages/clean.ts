import chalk from "chalk";
import Command from "../../classes/Command";

export default new Command(
  {
    name: "clean",
    description: "Cleans the chat log",
  },
  (chatLog) => {
    chatLog.log(chalk`{bgGreen CMD}: Cleaning messages`);
    for (let i = 0; i < 100; i++) chatLog.log(``);
  }
);
