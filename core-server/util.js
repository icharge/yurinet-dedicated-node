/**
 * Convert TIS-620 to UTF-8
 * 
 * @param {number} input Input byte or number.
 * @returns {string} Converted character.
 * 
 * @see http://www.thaibeginner.com/utf8-tis620-tis620-utf8-function/ Idea from here
 * @see http://www.ascii.ca/cp874.htm ASCII TIS-620 table
 */
exports.tis620CharCodeToUtf8 = function tis620CharCodeToUtf8(input) {
  if (input > 0xa0 && input < 0xfc) {
    input = input - 161 + 3585;
  }
  return String.fromCharCode(input);
}

/**
 * Convert UTF-8 to TIS-620 by adjust byte.
 * Opposite function
 * 
 * @param {number} input Input byte or number.
 * @returns {number} Converted byte or number.
 */
exports.utf8CharCodeToTis620 = function utf8CharCodeToTis620(input) {
  if (input > 3584 && input < 3676) {
    input = input - 161 + 3585;
  }
  return input;
}

exports.arrayBufferToBuffer = function arrayBufferToBuffer(ab) {
  // short hand
  var buf = new Buffer(new Uint8Array(ab));

  /*  var buf = new Buffer(ab.byteLength);
   var view = new Uint8Array(ab);
   for (var i = 0; i < buf.length; ++i) {
     buf[i] = view[i];
   } */
  return buf;
}

exports.createChatPacket = function createChatPacket(packetId, name, message) {
  const TEMPLATE = require('./constants').MSG_PAYLOAD_2;

  let sendBytes = new Uint8Array(473);

  for (let i in TEMPLATE) {
    sendBytes[i] = TEMPLATE[i];
  }

  // Push name to bytes array.
  // Don't let name length greater than 16.
  let nameLen = name.length < 17 ? name.length : 16;
  for (let i = 0; i < nameLen; i++) {
    sendBytes[i + 25] = exports.tis620CharCodeToUtf8(name.charCodeAt(i));
  }

  // Push message to bytes array.
  // Message length must less than 203.
  let messageLen = (message.length < 204 ? message.length : 203);
  let skip = false;

  // console.log('messageLen : ' + messageLen);

  for (let i = 69, charIndex = 0; charIndex < messageLen; i++) {
    if (!skip) {
      sendBytes[i] = exports.tis620CharCodeToUtf8(message.charCodeAt(charIndex++));
      console.log(i + ' ' + sendBytes[i])
    } else {
      sendBytes[i] = 0;
    }
    skip = !skip;
  }

  // Set packet ID
  sendBytes[9] = packetId;

  return sendBytes;
}

exports.createLobbyPacket = function createLobbyPacket(packetId, name) {
  const TEMPLATE = require('./constants').MSG_PAYLOAD_2;

  let sendBytes = new Uint8Array(473);

  for (let i in TEMPLATE) {
    sendBytes[i] = TEMPLATE[i];
  }

  // Push name to bytes array.
  // Don't let name length greater than 16.
  let nameLen = name.length < 17 ? name.length : 16;
  for (let i = 0; i < nameLen; i++) {
    sendBytes[i + 25] = exports.tis620CharCodeToUtf8(name.charCodeAt(i));
  }

  // Set packet ID
  sendBytes[0] = 255;
  sendBytes[9] = packetId

  sendBytes[21] = 0;

  return sendBytes;
}
