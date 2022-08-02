import blessed from "blessed";
import chalk from "chalk";
import CONSTANTS from "../CONSTANTS.json";

export default async function ({ screen }: SetupProps) {
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

  const connectionBox = blessed.text({
    label: "Connection",
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

  screen.append(titleBox);
  screen.append(chatBox);
  screen.append(inputBox);
  screen.append(connectionBox);
  screen.append(addressBox);
  screen.render();

  msgInput.key(["C-c"], () => process.exit(0));
  msgInput.focus();

  return {
    chatLog,
    msgInput,
    connectionBox,
    addressBox,
    titleBox,
    inputBox,
  };
}

export interface SetupProps {
  screen: blessed.Widgets.Screen;
}
