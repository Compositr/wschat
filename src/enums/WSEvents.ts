const enum WSEvents {
  MESSAGE = "CHAT_MESSAGE",
  NEW_PEER = "NEW_PEER",

  /** @deprecated */
  LIST_NICKS = "LIST_NICKS",
  /** @deprecated */
  NICK_RESPONSE = "NICK_RESPONSE",

  STATS_USERS = "STATS_USERS",
}

export default WSEvents;
