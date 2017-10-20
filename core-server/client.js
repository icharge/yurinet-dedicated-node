const { GAME } = require('./constants');
exports.Client = class Client {

  constructor() {

    this.id = -1;
    this.connection = {
      address: '0.0.0.0',
      port: 0,
    };
    this.name = '';
    this.timestamp = new Date();
    this.game = GAME.NON;

  }

}


