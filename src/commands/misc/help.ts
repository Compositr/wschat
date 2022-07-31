import chalk from "chalk";
import Command from "../../classes/Command";

export default new Command("help", (chatLog) => {
  chatLog.log(chalk`{bgGreen CMD}: {bold Help Menu}`)
  chatLog.log(chalk`{bgGreen CMD}: {bold /help} - Shows this menu`)
  chatLog.log(chalk`{bgGreen CMD}: {bold /nick <nickname>} - Set a nickname (no spaces)`)
});
