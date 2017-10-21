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
