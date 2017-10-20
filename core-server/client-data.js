const { GAME } = require('./constants');

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

    // Extract name & message when Mode = 12.
    // if (this.mode == 12) {
    this.clientName = this._extractClientName(rawData);
    this.clientMessage = this._extractMessage(rawData);
    // }

    console.log('Client Data :', rawData.toString('UTF-8'));

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
      strArray.push(String.fromCharCode(byte));
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
    let strArray = [];
    const messageStartIndex = 69;
    const messageEndIndex = messageStartIndex + 203;
    for (let i = messageStartIndex; i < messageEndIndex; i++) {
      const byte = data[i];

      // stop when \0.
      if (byte == 0) {
        break;
      }
      strArray.push(String.fromCharCode(byte));
    }


    let clientName = strArray.join('').trim();
  }

}
