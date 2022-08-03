import blessed from "blessed";
import TitleText from "./components/title/TitleText";
import version from "./version.json";

export default async function () {
  const screen = blessed.screen({
    smartCSR: true,
    title: `WSChat ${version.version}`,
    dockBorders: true,
  });

  screen.append(TitleText());
  screen.render();
}
