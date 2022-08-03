export interface Message {
  type: MessageTypes
}

export enum MessageTypes {
  CLEARTEXT,
  PGPSIGNED,
  PGPENCRYPTED
}