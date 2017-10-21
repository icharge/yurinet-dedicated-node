"use strict";

// WebApp & Server
const io = require('socket.io');

// Server
// const socketioJwt = require('socketio-jwt');

// Client map
// var clients = {};

/**
 * Socket Controller
 */
class SocketController {

  /**
   * Constrcutor of SocketController
   * 
   * @param {http.Server} httpServer 
   */
  constructor(httpServer) {
    this.io = io.listen(httpServer);

    // Set authorization
    // this.io.set('authorization', socketioJwt.authorize({
    //     secret: require('./secret').SECRET_KEY,
    //     handshake: true,
    // }));

    /* this.io.use(function (data, accept) {
      // Web will except for this auth

      var req = data.request || data;
      var type;

      if (req._query && req._query.type) {
        type = req._query.type;
      }
      else if (req.query && req.query.type) {
        type = req.query.type;
      }

      // console.log('Req type :', type);

      if (type === 'WebFXTH2017-NaJaEiEi') {
        // console.log('Web !');
        if (data.request) {
          accept();
        } else {
          accept(null, true);
        }

        data.decoded_token = {
          clientType: 'web',
        };
        return;
      }

      return socketioJwt.authorize({
        secret: require('./secret').SECRET_KEY,
        // timeout: 15000,
        handshake: true,
      })(data, accept);
    }); */

    var _this = this;

    // When connection established
    this.io.on('connection', (socket) => {

      // console.log('Decoded token :', socket.decoded_token);
      // console.log('Connected from ...');

      socket.on('error', function (err) {
        console.log('Error : ', err);
      });

      this.onConnect(socket);

    });

  }

  /**
   * Client socket callback
   * 
   * @param {SocketIO.Socket} socket The Socket
   */
  onConnect(socket) {

    // Message event
    socket.on('message', function (data) {
      console.log('Message from client : ', data);

      // Response
      //io.emit('message', 'msg : ' + data.message);
      // io.emit('start', 'test');
    });
  }

  /**
   * Emit Lobby message to who is listening.
   */
  emitLobbyMessage(obj) {
    this.io
      // .to('lobby')
      .emit('lobby.chat', obj);
  }

}


// Expose at end of file
module.exports = SocketController;
