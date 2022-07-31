import client from "./client";

const [, , address] = process.argv;
client("Unnamed", address);
