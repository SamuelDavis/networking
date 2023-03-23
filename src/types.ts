import Peer from "peerjs";

export type NetworkMessage = {
  type: string;
  payload: any;
  date: Date;
  source: Peer["id"];
};

export function isNetworkMessage(value: any): value is NetworkMessage {
  return (
    typeof value === "object" &&
    ["type", "payload", "date", "source"].every((property) =>
      value.hasOwnProperty(property)
    )
  );
}
