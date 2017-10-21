const { GAME } = require('./constants');
const { tis620CharCodeToUtf8 } = require('./util');

exports.ClientData = class ClientData {

  /**
   * 
   * @param {Buffer} rawData 
   */
  constructor(rawData) {
    this.raw = rawData;

    this.cmdCommand = rawData[0];

    this.nameLength = rawData[8];
    this.msgLength = rawData[12];

    this.mode = rawData[21];

    this.gameId = rawData[19];
    if (this.gameId == 3) {
      this.gameVersion = GAME.RA2;
    } else {
      this.gameVersion = GAME.YR;
    }

    // Debugging logs
    console.log('Client Data :');
    console.log('  cmd :', this.cmdCommand);
    console.log('  mode :', this.mode);

    // Extract name & message when Mode = 12.
    if (this.mode == 12) {
      this.clientName = this._extractClientName(rawData);
      this.clientMessage = this._extractMessage(rawData);
      console.log('  Name :', this.clientName);
      console.log('  Message :', this.clientMessage);
      console.log('  bytes :', [...rawData]);
    }


  }

  /**
   * Create Client data with message text. (Only when message available)
   * 
   * @param {Buffer} rawData RAW Bytes array.
   * @returns {ClientData} Client data model.
   */
  static createClientMessage(rawData) {
    let mode = rawData[21];

    if (mode == 12) { // Is it a Lobby chat thing ?
      return new ClientData(rawData);
    } else {
      return null;
    }
  }

  /**
   * Extract client name.
   * 
   * @param {Buffer} data Raw Data.
   */
  _extractClientName(data) {
    let strArray = [];
    for (let i = 25; i < 42; i++) {
      const byte = data[i];

      // stop when \0.
      if (byte == 0) {
        break;
      }
      strArray.push(tis620CharCodeToUtf8(byte));
    }

    let clientName = strArray.join('').trim();
    return clientName;
  }

  /**
   * Extract client message.
   * 
   * @param {Buffer} data Raw Data.
   */
  _extractMessage(data) {
    const messageStartIndex = 69;
    const messageEndIndex = messageStartIndex + 203;

    let strArray = [];
    let foundTerminateChar = false;
    for (let i = messageStartIndex; i < messageEndIndex; i++) {
      const byte = data[i];

      // stop when \0.
      if (byte == 0) {
        if (foundTerminateChar) {
          break;
        }
        foundTerminateChar = true;
        continue;
      }

      foundTerminateChar = false;
      strArray.push(tis620CharCodeToUtf8(byte));
    }


    let message = strArray.join('').trim();
    return message;
  }

}
