
// exports = class CoreConstants {

// }

/**
 * Type of command in first byte.
 */
exports.CMD_TYPE = {
  CMD_CONTROL: 0xFE,
  CMD_BROADCAST: 0xFF
}

/**
 * Type of control in second byte.
 */
exports.CTL_TYPE = {
  CTL_PING: 0x0,
  CTL_QUERY: 0x1,
  CTL_RESET: 0x2,
  CTL_DISCONNECT: 0x3,
  CTL_PROXY: 0x4,
  CTL_PROXY_DISCONNECT: 0x5
}

/**
 * Type of game.
 */
exports.GAME = {
  NON: 'N/A',
  RA2: 'RA2',
  YR: 'YR'
}

/**
 * Payload for send message in Lobby. (Not worked)
 *
 * Name:    index 25 to 25 + 16.
 * Message: index 69 to 475. (with 0x00 seperated)
 * Packet ID: index 9
 */
exports.MSG_PAYLOAD = [
  255, 5, 198, 161, 61, 54, 18, 0, 0, /* PacketID */42,
  0, 0, 0, 0, 0, 0, 0, 0, 0, /* GameID */4,
  170, /* mode */12, 0, 0, 0,
  /* name. */
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
];

exports.MSG_PAYLOAD_2 = [
  255, 52, 158, 188, 30, 54, 18, 0, 0, /* PacketID */1,
  0, 0, 0, 0, 0, 0, 0, 0, 0, /* GameID */4,
  170, /* mode */12, 0, 0, 0,
]
