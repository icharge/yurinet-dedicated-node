'use strict';

process.stdout.write("\x1Bc"); // Clear screen buffer.

require('lazy.js');
const dgram = require('dgram');
const server = dgram.createSocket('udp4');
const readline = require('readline');
const util = require('util')
const rl = readline.createInterface(process.stdin, process.stdout);

// Override print log function.
var fu = function(type, args) {
  let text = util.format.apply(console, args);
  try {
    let t = Math.ceil((rl.line.length + 3) / process.stdout.columns);
    rl.output.write("\n\x1B[" + t + "A\x1B[0J");
    rl.output.write(text + "\n");
    rl.output.write(Array(t).join("\n\x1B[E"));
    rl._refreshLine();
  } catch(e) {
    fu.log(text);
  }
};

fu.log = console.log;

console.log = function() {
    fu("log", arguments);
};
console.warn = function() {
    fu("warn", arguments);
};
console.info = function() {
    fu("info", arguments);
};
console.error = function() {
    fu("error", arguments);
};

console.log('YuriNET Dedicated Server v1 - NODEJS');
console.log('====================================');
console.log();
console.log('Initializing server...');

// Add listener events.
server.on('error', (err) => {
  console.log(`server error:\n${err.stack}`);
  server.close();
});

server.on('listening', () => {
  var address = server.address();
  console.log(`Server started. And listening ${address.address}:${address.port}...`);

  // Show prompt.
  rl.setPrompt('> ');
  rl.prompt();
});

// Input
rl.on('line', (line) => {
  line = line.trim();
  if (line != '') {
    let args = line.split(' ');

    switch(args[0].trim()) {
      case 'hi':
        console.log('Hello !!');
        break;

      case 'count':
      case 'online':
      case 'useronline':
        if (args[1] == 'detail') {
          console.log(`All clients detail here : \n${JSON.stringify(clients, null, 2)}`);
        }
        console.log(`There are ${clientCount} online.`);
        break;

      default:
        console.log(`What do you mean '${line}' ?`);

    }
  }

  rl.prompt();
}).on('close', () => {
  console.log('Goodbye ..');
  process.exit(0);
});
rl.on('SIGINT', () => {
  rl.question('\n You pressed ^C ! '
    + '\n Choose your choice : '
    + '\n [1] Stop server immediately.'
    + '\n [2] Stop server when all players are leaved.'
    + '\n > ', (ans) => {
    if (ans.trim() == '1') {
      rl.close();
    } else if (ans.trim() == '2') {
      console.log('Server stopped when all players are leaved.');
      isWaitStop = true;
    } else {
      console.log('Cancelled');
    }

    rl.prompt();
  });
});

/**
 * Type of command in first byte.
 */
const cmdType = {
  CMD_CONTROL: 0xFE,
  CMD_BROADCAST: 0xFF
};

/**
 * Type of control in second byte.
 */
const ctlType = {
  CTL_PING: 0x0,
  CTL_QUERY: 0x1,
  CTL_RESET: 0x2,
  CTL_DISCONNECT: 0x3,
  CTL_PROXY: 0x4,
  CTL_PROXY_DISCONNECT: 0x5
};

/**
 * Type of game.
 */
const Game = {
  NON: 'N/A',
  RA2: 'RA2',
  YR: 'YR'
};

/**
 * Initialize global variables.
 */
// Defined started date time.
const startedAt = new Date();

// Count only.
var processCount = 0;

// Max client number.
var peekClient = 0;

// Clients collection.
var clients = {};

// Clients collection by IP:Port as key.
var clientsIpList = {};

// Client count.
var clientCount = 0;

// Stop server when all player leaved.
var isWaitStop = false;

// Configuration object.
var Config = {};
Config.port = 9000;
Config.timeout = 10;
Config.maxClients = 100;

// Argument parsing...
Config.port = Number(process.argv[2]) || Config.port;

console.log(': Server options :');
console.log(JSON.stringify(Config, null, 2));
console.log();

/**
 * Class of client.
 */
var Client = function () { /*.. */ };
Client.prototype = function () {
  let proto = {};
  proto.id = -1;
  proto.connection = {
    address: '0.0.0.0',
    port: 0
  };
  proto.name = '';
  proto.timestamp = new Date();
  proto.game = Game.NON;

  return proto;
}();

/**
 * Count clients on list.
 * @return {Number} Number of clients.
 */
var getClientCount = function () {
  let count = 0;
  for (let i in clients) {
    if (clients[i] != null)
      count++;
  }
  return count;
};

/**
 * Client seeker class.
 */
var ClientSeeker = (function (clientList, clientListIp, max) {
  let index = 0;
  let seeker = {};

  seeker.findFreeSlot = function () {
    let client = -1;
    for (let c = 0; c < max; index++, c++) {
      if (index > max) {
        index = 0;
      }

      if (null == clients[index]) {
         client = index;
         break;
      }
    }
    return client;
  };

  seeker.addClient = function (client) {
    if (null != client) {
      let addr = client.connection.address + ':' + client.connection.port;
      clientList[client.id] = client;
      clientListIp[addr] = client;
      clientCount++;

      console.log(`Added client #${client.id} from ${addr}`);
    }
  };

  seeker.removeClient = function (id) {
    let client = clientList[id];
    if (null != client) {
      let addr = client.connection.address + ':' + client.connection.port;
      clientList[id] = null;
      delete clientListIp[addr];

      console.log(`Removed client #${id} from ${addr}`);
    }
  }

  seeker.removeClientByIp = function (ip, port) {
    let addr = ip + ':' + port;
    let client = clientListIp[addr];
    if (null != client) {
      clientList[client.id] = null;
      delete clientListIp[addr];
      clientCount--;

      console.log(`Removed client #${client.id} by IP:Port ${addr}`);
    }

    client = null;
  }

  return seeker;
})(clients, clientsIpList, Config.maxClients);

// Initiate client array list.
for (var i = 0; i < Config.maxClients; i++) {
  clients[i] = null;
  //clients.push(null);
}


// Received data.
// rinfo : Remote endpoint info.
server.on('message', (data, rinfo) => {
  let procId = ++processCount;

  //console.log(`#${procId}] server got: data from ${rinfo.address}:${rinfo.port}`);
  //console.log('Remote Endpoint Obj : ' + JSON.stringify(rinfo));

  let dataLen = data.length;
  //console.log(`#${procId}] Data length: ${dataLen}`);

  // Initial command bytes.
  let cmdByte = null,
      ctlByte = null;

  // Get command byte.
  cmdByte = data[0];
  ctlByte = data[1];

  //console.log(`#${procId}] cmdByte: ${cmdByte} | ctlByte: ${ctlByte}`);

  // Exit when null.
  if (null == cmdByte || null == ctlByte) {
    return;
  }

  if (cmdByte == cmdType.CMD_CONTROL) {
    console.log(`#${procId}] CMD_CONTROL..`);

    if (ctlByte == ctlType.CTL_PING) {
      console.log(`#${procId}]  > CTL_PING`);

      // Send back data.
      server.send(data, 0, data.length, rinfo.port, rinfo.address);
      return;
    } else if (ctlByte == ctlType.CTL_QUERY) {
      console.log(`#${procId}] > CTL_QUERY`);
      console.log(`#${procId}] from: ${rinfo.address}:${rinfo.port}`);
      // TODO: Response info as Json.

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
          for(let key in clientsIpList) {
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
      return;
    } else if (ctlByte == ctlType.CTL_RESET) {
      console.log(`#${procId}] > CTL_RESET`);

    } else if (ctlByte == ctlType.CTL_DISCONNECT) {
      console.log(`#${procId}] > CTL_DISCONNECT`);

      ClientSeeker.removeClientByIp(rinfo.address, rinfo.port)
      return;
    } else if (ctlByte == ctlType.CTL_PROXY) {
      console.log(' > CTL_PROXY');

      //return;
    } else if (ctlByte == ctlType.CTL_PROXY_DISCONNECT) {
      console.log(' > CTL_PROXY_DISCONNECT');

      //return;
    } else {
      console.log(`#${procId}] > ?? Something else: ${ctlByte}`);
      ////////// Ignore ///////////
      return;
    }

  }

  // Is full of clients?
  if (clientCount >= Config.maxClients) {
    console.log(`#${procId}] Server is full !.`);
    console.log(`#${procId}] from: ${rinfo.address}:${rinfo.port}`);
    return;
  }

  // Find client Obj by Endpoint.
  let client = clientsIpList[rinfo.address + ':' + rinfo.port];

  //console.log('client : ' + client);

  // New or Exist?
  if (null != client) {
    client.timestamp = new Date();
    //console.log(`#${procId}] Found client.`);
  } else {
    let emptySlot = ClientSeeker.findFreeSlot();
    console.log(`Got empty slot : ${emptySlot}`);

    if (emptySlot > -1) {
      // new client.
      client = new Client();
      client.connection = rinfo;
      client.id = emptySlot;
      client.timestamp = new Date();

      // Add client to list.
      //clients[emptySlot] = client;
      //clientsIpList[rinfo.address + ':' + rinfo.port] = client;
      //clientCount++;
      ClientSeeker.addClient(client);

      //console.log(`#${procId}] Inserted new client as #${emptySlot}`);
      //console.log(`#${procId}] from: ${rinfo.address}:${rinfo.port}`);
    } else {
      console.log(`Server full !!`);
    }

    return;
  }

  if (cmdByte == cmdType.CMD_BROADCAST) {
    // Set id to first byte.
    data[0] = client.id;

    for (let i in clientsIpList) {
      if (null == clientsIpList[i])
        continue;

      if (clientsIpList[i].id != client.id) {
        let clientConn = clientsIpList[i].connection;
        //console.log(`#${procId}] Broadcast by ${client.id} to ${i}`);
        server.send(data, 0, data.length, clientConn.port, clientConn.address);
      }
    }

    // Set name & game to current client
    if (client != null) {
      // Make Async.
      setTimeout(function (client, data) {

        // Check if have no name.
        if (client.name == "" || client.name == null) {
          try {
            console.log('Resolving name...');

            let clientName = '',
                clientNameArr = [];

            // SubArray name from data.
            clientNameArr = function (obj) {
              let byteArr = [];
              for(let i = 25; i < 42; i++) {
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

        if (client.game == Game.NON) {
          let clientGame = Game.NON;

          if (data[19] == 3) {
            clientGame = Game.RA2;
          } else if (data[19] == 4) {
            clientGame = Game.YR;
          }

          client.game = clientGame;
        }
      }, 1, client, data);

    }
    // END of Getting name.---------------------------------------------------------

  } else if (cmdByte != client.id) {
    // Send to specified ID.
    let idToSend = cmdByte;
    data[0] = client.id;

    //console.log(`#${procId}] Sending from ${client.id} to ${idToSend}.`);
    let clientToSend = clients[idToSend];

    //console.log(`#${procId}] clientToSend : ` + JSON.stringify(clientToSend));
    if (!!clientToSend) {
      //console.log(`#${procId}] Sending...`);
      server.send(data, 0, data.length, clientToSend.connection.port,
        clientToSend.connection.address);
    }
  }

});

//console.log('clients:', JSON.stringify(clients));

/**
 * Timeout Kicker.
 */
var timeoutKicker = function () {
  processCount = 0;

  if (clientCount > peekClient) {
    peekClient = clientCount
  }

  let nowDate = new Date();
  for(let i in clientsIpList) {
    if (null == clientsIpList[i]) {
      continue;
    }

    let diff = Math.round((nowDate - clientsIpList[i].timestamp) / 1000);
    //console.log('Diff ' + diff);
    if (diff > Config.timeout) {
      let clientId = clientsIpList[i].id;
      ClientSeeker.removeClient(clientId);
      console.log('Kicked client #' + clientId);
    }
  }
  clientCount = getClientCount();

  if (isWaitStop) {
    if (clientCount <= 0) {
      console.log('All player leaved. Stop server on ' + new Date());
      rl.close();
    }
  }
};

var timeoutKickerPromise = setInterval(timeoutKicker, 1000);
console.log(`Started timeoutKicker.`);

// Open server port.
server.bind(Config.port);
