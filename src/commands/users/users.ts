import chalk from "chalk";
import Command from "../../classes/Command";
import WSEvents from "../../enums/WSEvents";
import type UserStats from "../../types/stats/UserStats";

export default new Command({
  name: "users",
  description: "Shows the number of users connected",
}, async (chatLog, clientSocket, socketio) => {
  chatLog.log(chalk`{bgGreen CMD}: Querying connected peers`);
  const connected = await socketio.sockets.allSockets();
  chatLog.log(
    chalk`{bgGreen CMD}: {green ${connected.size}} peers connected directly`
  );
  clientSocket.emit(WSEvents.STATS_USERS, (returned: UserStats) => {
    chatLog.log(
      chalk`{bgGreen CMD}: {green ${returned.users}} peers connected to other peers`
    );
  });
});
