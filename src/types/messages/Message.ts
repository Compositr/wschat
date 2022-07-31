export default interface Message {
  content: string;
  author: string;
  timestamp: number;
}

/** @deprecated */
export interface Nickname {
  name: string;
}
