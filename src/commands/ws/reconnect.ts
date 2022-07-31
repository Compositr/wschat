import Command from "../../classes/Command";

export default new Command(
  {
    name: "reconnect",
    description: "Reconnects to the initial server",
  },
  (_, socket) => {
    socket.connect();
  }
);
