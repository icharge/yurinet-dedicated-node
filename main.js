// TODO: Use IP:Port as key for array instead ID
// And store ID to another List.

'use strict';

require('lazy.js');
const dgram = require('dgram');
const server = dgram.createSocket('udp4');
const readline = require('readline');
const rl = readline.createInterface(process.stdin, process.stdout);

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
        console.log(`There are ${clientCount()} online.`);
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

// Enum Command.
const cmdType = {
  CMD_CONTROL: 0xFE,
  CMD_BROADCAST: 0xFF
};

const ctlType = {
  CTL_PING: 0x0,
  CTL_QUERY: 0x1,
  CTL_RESET: 0x2,
  CTL_DISCONNECT: 0x3,
  CTL_PROXY: 0x4,
  CTL_PROXY_DISCONNECT: 0x5
};

const Game = {
  NON: 0,
  RA2: 1,
  YR: 2
};

// Initialize global variables.
const startedAt = new Date();

var processCount = 0;
var peekClient = 0;
var clients = {};
var Config = {};
Config.port = 9000;
Config.timeout = 10;
Config.maxClients = 100;

// Argument parsing...
Config.port = Number(process.argv[2]) || Config.port;

console.log(': Server options :');
console.log(JSON.stringify(Config, null, 2));
console.log();

// Client Class.
var Client = function() {
  this.id = 0;
  this.connection = {
    address: '0.0.0.0',
    port: 0
  };
  this.name = '';
  this.timestamp = new Date();
  this.game = Game.NON;

  return this;
};

var clientCount = function () {
  let count = 0;
  for (let i in clients) {
    if (clients[i] != null)
      count++;
  }
  return count;
};

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

      let jsonReturn = new Buffer(JSON.stringify({
        serverstate: 'online',
        servername: 'NODEJS',
        serverport: Config.port,
        launchedon: startedAt,
        maxclients: Config.maxClients,
        peekclients: peekClient,
        clientcount: clientCount(),
        clients: {} // TODO: get clients list.
      }));
      server.send(jsonReturn, 0, jsonReturn.length, rinfo.port, rinfo.address);
    } else if (ctlByte == ctlType.CTL_RESET) {
      console.log(`#${procId}] > CTL_RESET`);

    } else if (ctlByte == ctlType.CTL_DISCONNECT) {
      console.log(`#${procId}] > CTL_DISCONNECT`);

      for (let i in clients) {
        if (null == clients[i])
          continue;

        let cConn = clients[i].connection;
        if (cConn.address + cConn.port == rinfo.address + rinfo.port) {
          clients[i] = null;
          break;
        }
      }
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
  if (clientCount() >= Config.maxClients) {
    console.log(`#${procId}] Server is full !.`);
    console.log(`#${procId}] from: ${rinfo.address}:${rinfo.port}`);
    return;
  }

  // Find client Obj by Endpoint.
  let client = function () {
    for (let i in clients) {
      if (null == clients[i])
        continue;

      let cConn = clients[i].connection;
      if (cConn.address + cConn.port == rinfo.address + rinfo.port)
        return clients[i];
    }
  }();

  //console.log('client : ' + client);

  // New or Exist?
  if (null != client) {
    client.timestamp = new Date();
    //console.log(`#${procId}] Found client.`);
  } else {
    let emptySlot = function () {
      for (let i in clients) {
        if (!clients[i]) {
          return i;
        }
      }

      return null;
    }();

    // new client.
    client = new Client();
    client.connection = rinfo;
    client.id = emptySlot;
    client.timestamp = new Date();

    clients[emptySlot] = client;
    console.log(`#${procId}] Inserted new client as ${emptySlot}`);
    console.log(`#${procId}] from: ${rinfo.address}:${rinfo.port}`);

    return;
  }

  if (cmdByte == cmdType.CMD_BROADCAST) {
    // Set id to first byte.
    data[0] = client.id;

    for (let i in clients) {
      if (null == clients[i])
        continue;

      if (clients[i].id != client.id) {
        let clientConn = clients[i].connection;
        //console.log(`#${procId}] Broadcast by ${client.id} to ${i}`);
        server.send(data, 0, data.length, clientConn.port, clientConn.address);
      }
    }

    // TODO: Get player name from packet.
    // TODO: Get game from packet.

  } else if (cmdByte != client.id) {
    // Send to specified ID.
    let idToSend = cmdByte;
    data[0] = client.id;

    //console.log(`#${procId}] Sending from ${client.id} to ${idToSend}.`);
    let clientToSend = function () {
      for (let i in clients) {
        if (null == clients[i])
          continue;

        if (clients[i].id == idToSend) {
          return clients[i];
        }
      }
    }();

    //console.log(`#${procId}] clientToSend : ` + JSON.stringify(clientToSend));
    if (clientToSend) {
      //console.log(`#${procId}] Sending...`);
      server.send(data, 0, data.length, clientToSend.connection.port,
        clientToSend.connection.address);
    }
  }

});

//console.log('clients:', JSON.stringify(clients));

var timeoutKicker = function () {
  processCount = 0;

  if (clientCount() > peekClient) {
    peekClient = clientCount();
  }

  let nowDate = new Date();
  for(let i in clients) {
    if (null == clients[i]) {
      continue;
    }

    let diff = Math.round((nowDate - clients[i].timestamp) / 1000);
    //console.log('Diff ' + diff);
    if (diff > timeout) {
      clients[i] = null;
      console.log('Kicked client #' + i);
    }
  }
};

var timeoutKickerPromise = setInterval(timeoutKicker, 1000);
console.log(`Started timeoutKicker.`);

// Open server port.
server.bind(Config.port);
