
import { Socket, AddressInfo, createSocket } from 'dgram';

// const dgram = require('dgram');

const constants = require('./constants');
const Config = require('./config');
const ClientSeeker = require('./client-seeker');
const Client = require('./client');


exports.CoreServer = class CoreServer {

  get isServerStarted() {
    return !!this._server;
  }

  get config() {
    return this._config;
  }

  get clientCount() {
    return this._clientSeeker.getClientCount();
  }

  get peekClient() {
    return this._peekClient;
  }

  get clientsMapIp() {
    return this._clientSeeker.getClientsMapIp();
  }

  get startedAt() {
    return this._startedAt;
  }

  /**
   * Config instance
   * 
   * @type {Config}
   */
  _config;

  /**
   * @type {ClientSeeker}
   */
  _clientSeeker;

  /**
   * @type {{[key: string]: Client}}
   */
  _clients;

  /**
   * Max client online.
   * 
   * @type {number}
   */
  _peekClient;

  /**
   * UDP Server instance
   * 
   * @type {Socket}
   */
  _server;

  /**
   * Started server at.
   * 
   * @type {Date}
   */
  _startedAt;

  /**
   * Stopping state.
   * 
   * @type {boolean}
   */
  _isStopping;

  /**
   * @type {NodeJS.Timer}
   */
  _clientsCleanerTimer;

  /**
   * 
   * @param {Config} config 
   */
  constructor(config) {
    this._config = config;
    this._clientSeeker = new ClientSeeker();
    this._isStopping = false;

  }

  startUdpServer() {

  }

  startServer() {
    // Prepare server
    this._server = createSocket('udp4');

    this._clientsCleaner = setInterval(() => this._clientsCleaner());

    this._server.on('message', (data, rinfo) => this._serverOnMessage(data, rinfo));

    this._server.bind(this._config.port);

    this._startedAt = new Date();
  }

  /**
   * Request to stop Server.
   * 
   * @param {boolean} isForce Force stop when clients even online.
   */
  stopServer(isForce) {
    this._isStopping = true;

    if (isForce) {
      this._killSocket();
    }
  }

  /**
   * On message event (Incoming message).
   * 
   * @param {Buffer} data 
   * @param {AddressInfo} rinfo 
   * 
   * @private
   */
  _serverOnMessage(data, rinfo) {
    // Keep Data length in some place.
    let dataLen = data.length;

    // Assign header value from incoming data.
    let cmdByte = data[0];
    let ctlByte = data[1];

    // Invalid data will ignore.
    if (null == cmdByte || null == ctlByte) {
      return;
    }

    // When first byte is CMD CTRL.
    if (cmdByte == constants.CMD_TYPE.CMD_CONTROL) {
      console.log(`CMD_CONTROL..`);

      // PING?
      if (ctlByte == constants.CTL_TYPE.CTL_PING) {
        console.log(`  > CTL_PING`);

        // Send back data.
        this._server.send(data, 0, data.length, rinfo.port, rinfo.address);
        return;
      } else if (ctlByte == constants.CTL_TYPE.CTL_QUERY) { // Query data.
        /* console.log(` > CTL_QUERY`);
        console.log(` from: ${rinfo.address}:${rinfo.port}`);

        let strReturn = JSON.stringify({
          serverstate: 'online',
          servername: 'NODEJS',
          serverport: Config.port,
          launchedon: startedAt,
          maxclients: Config.maxClients,
          peekclients: peekClient,
          clientcount: clientCount,
          clients: (function () {
            let clientsArr = [];
            for (let key in clientsIpList) {
              let c = clientsIpList[key];
              let client = {
                name: c.name,
                game: c.game,
                timestamp: c.timestamp
              };

              clientsArr.push(client);
            }

            return clientsArr;
          })()
        });

        //console.log(strReturn);

        let jsonReturn = new Buffer(strReturn);
        server.send(jsonReturn, 0, jsonReturn.length, rinfo.port, rinfo.address);

        // No need to store this client action.
        return; */
      } else if (ctlByte == constants.CTL_TYPE.CTL_RESET) {
        console.log(` > CTL_RESET`);

      } else if (ctlByte == constants.CTL_TYPE.CTL_DISCONNECT) {
        console.log(` > CTL_DISCONNECT`);

        this._clientSeeker.removeClientByIp(rinfo.address, rinfo.port)
        return;
      } else if (ctlByte == constants.CTL_TYPE.CTL_PROXY) {
        console.log(' > CTL_PROXY');

        //return;
      } else if (ctlByte == constants.CTL_TYPE.CTL_PROXY_DISCONNECT) {
        console.log(' > CTL_PROXY_DISCONNECT');

        //return;
      } else {
        console.log(` > ?? Something else: ${ctlByte}`);
        ////////// Ignore ///////////
        return;
      }

    }

    // Is full of clients?
    if (this._clientSeeker._clientCount >= this._config.maxClients) {
      console.log(` Server is full !.`);
      console.log(` from: ${rinfo.address}:${rinfo.port}`);
      return;
    }

    // Find client Obj by Endpoint.
    let client = this._clientSeeker.getClientByIp(rinfo.address + ':' + rinfo.port);

    //console.log('client : ' + client);

    // New or Exist?
    if (client != null) {
      client.timestamp = new Date();
      //console.log(` Found client.`);
    } else {
      let emptySlot = this._clientSeeker.findFreeSlot();
      console.log(`Got empty slot : ${emptySlot}`);

      if (emptySlot > -1) {
        // new client.
        client = new Client();
        client.connection = rinfo;
        client.id = emptySlot;
        client.timestamp = new Date();

        // Add client to list.
        this._clientSeeker.addClient(client);

        //console.log(` Inserted new client as #${emptySlot}`);
        //console.log(` from: ${rinfo.address}:${rinfo.port}`);
      } else {
        console.log(`Server full !!`);
      }

      /*
      setTimeout(function (client) {
        let testFeedback = genSendMsgBytes('SYSTEM', 'Welcome to Thai RA2 Lovers.');
        //testFeedback[0] = client.id;
        console.log('bytes >> ');
        console.log(testFeedback);
        testFeedback = new Buffer(testFeedback);
        server.send(testFeedback, 0, testFeedback.length, client.connection.port, client.connection.address);
      }, 1000, client);
      */

      return;
    }

    // Broadcast package to all player.
    if (cmdByte == cmdType.CMD_BROADCAST) {
      // Set id to first of byte.
      data[0] = client.id;

      // Get Clients map with IP.
      let clientsMapIp = this._clientSeeker.getClientsMapIp();

      // Find all clients and send data to.
      for (let i in clientsMapIp) {
        if (clientsMapIp[i] == null)
          continue; // Skip free slot.

        // Send data to all except sender.
        if (clientsMapIp[i].id != client.id) {
          let clientConn = clientsMapIp[i].connection;
          //console.log(` Broadcast by ${client.id} to ${i}`);
          this._server.send(data, 0, data.length, clientConn.port, clientConn.address);
        }
      }

      // Store client info.
      if (client != null) {
        // Make Async Client name getting.
        setTimeout(() => {

          // Try to get client name when unavailable.
          if (!client.name) {
            try {
              console.log('Resolving name...');

              let clientName = '',
                clientNameArr = [];

              // SubArray name from data.
              clientNameArr = function (obj) {
                let byteArr = [];
                for (let i = 25; i < 42; i++) {
                  byteArr.push(obj[i]);
                }

                return byteArr;
              }(data);

              // Map char data.
              clientNameArr.map(function (value, index) {
                // Not need \0 terminated string.
                if (value == 0) {
                  delete clientNameArr[index];
                  return;
                }

                // Change byte to Char.
                clientNameArr[index] = String.fromCharCode(value);
              });

              // Join char to String.
              clientName = clientNameArr.join('').trim();

              client.name = clientName;

              console.log('Resolved name is ' + clientName);
            } catch (ex) {
              console.error("Can't get name from bytes !");
              console.error(ex);
            }
          }

          if (client.game == constants.GAME.NON) {
            let clientGame = constants.GAME.NON;

            if (data[19] == 3) {
              clientGame = constants.GAME.RA2;
            } else if (data[19] == 4) {
              clientGame = constants.GAME.YR;
            }

            client.game = clientGame;
          }
        }, 1);

      }
      // END of Getting name.---------------------------------------------------------

    } else if (cmdByte != client.id) {
      // Send to specified ID.
      let idToSend = cmdByte;
      data[0] = client.id;

      //console.log(` Sending from ${client.id} to ${idToSend}.`);
      let clientToSend = this._clientSeeker.getClientById(idToSend);

      //console.log(` clientToSend : ` + JSON.stringify(clientToSend));
      if (!!clientToSend) {
        //console.log(` Sending...`);
        this._server.send(data, 0, data.length, clientToSend.connection.port,
          clientToSend.connection.address);
      }
    }
  }

  _clientsCleaner() {
    if (this.clientCount > this._peekClient) {
      this._peekClient = this.clientCount;
    }

    let nowDate = new Date();
    let clientsIpMap = this._clientSeeker.getClientsMapIp();
    for (let i in clientsIpMap) {
      if (clientsIpMap[i] == null) {
        continue;
      }

      let diff = Math.round((nowDate - clientsIpMap[i].timestamp) / 1000);
      //console.log('Diff ' + diff);
      if (diff > this._config.timeout) {
        let clientId = clientsIpMap[i].id;
        this._clientSeeker.removeClient(clientId);
        console.log('Kicked client #' + clientId);
      }
    }

    if (this._isStopping) {
      if (this.clientCount <= 0) {
        console.log('All player leaved. Stop server on ' + new Date());
        // rl.close();
        this._killSocket();
      }
    }
  }

  /**
   * Stop socket.
   * 
   * @private
   */
  _killSocket() {
    clearInterval(this._clientsCleanerTimer);

    this._server.close();
    this._server = null;
  }

}
