import chalk from "chalk";
import Command from "../../classes/Command";

export default new Command("clean", (chatLog) => {
  chatLog.log(chalk`{bgGreen CMD}: Cleaning messages`)
  for (let i = 0; i < 20; i++) {
    chatLog.log("");
  }
});
