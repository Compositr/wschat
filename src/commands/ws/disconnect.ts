import Command from "../../classes/Command";

export default new Command({
  name: "disconnect",
  description: "Disconnects from the server",
}, (_, socket) => {
  socket.disconnect();
})