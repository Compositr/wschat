import blessed from "blessed";
import chalk from "chalk";
import version from "../../version.json";

export default function TitleText() {
  return blessed.text({
    content: chalk`{bgCyan WSChat} ${version.version}`,
    align: "center",
    border: {
      type: "line",
    },
  });
}
