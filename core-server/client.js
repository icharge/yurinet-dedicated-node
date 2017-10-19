module.exports = class Client {

  /**
   * Client ID
   * 
   * @type {number}
   */
  id;

  /**
   * Connection info
   */
  connection = {
    address: '0.0.0.0',
    port: 0,
  };

  /**
   * Player name
   * 
   * @type {string}
   */
  name;

  /**
   * Last update timestamp
   * 
   * @type {Date}
   */
  timestamp;

  /**
   * Currently game.
   * 
   * @type {string}
   */
  game;

}


