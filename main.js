'use strict';

const { CoreServer } = require('./core-server/yurinet-core');
const { Config } = require('./core-server/config');
const SocketController = require('./socketio/socket-controller');

process.stdout.write("\x1Bc"); // Clear screen buffer.

require('lazy.js');
const util = require('util')
// const readline = require('readline');
// const rl = readline.createInterface(process.stdin, process.stdout);

process.on('uncaughtException', function (err) {
  console.error(err.stack);
  console.log("Node NOT Exiting...");
});

// Import WebServer
const express = require('express');
const wapp = express();
const httpServer = require('http').createServer(wapp);

httpServer.on('error', onError);
httpServer.on('listening', onListening);

function onError(error) {
  console.log('Http Server On Error :', error);
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      console.error('Error -> ', error);
      throw error;
  }
}

function onListening() {
  var addr = httpServer.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  console.log('Listening on ' + bind);
}

const socketCtrl = new SocketController(httpServer);

// Configuration object.
const config = new Config();
config.port = 9000;
config.timeout = 10;
config.maxClients = 100;

// Argument parsing...
config.port = Number(process.argv[2]) || config.port;

console.log(': Server options :');
console.log(JSON.stringify(config, null, 2));
console.log();

const server = new CoreServer(config);

// Override print log function.
/* var fu = function (type, args) {
  let text = util.format.apply(console, args);
  try {
    let t = Math.ceil((rl.line.length + 3) / process.stdout.columns);
    rl.output.write("\n\x1B[" + t + "A\x1B[0J");
    rl.output.write(text + "\n");
    rl.output.write(Array(t).join("\n\x1B[E"));
    rl._refreshLine();
  } catch (e) {
    fu.log(text);
  }
};

fu.log = console.log;

console.log = function () {
  fu("log", arguments);
};
console.warn = function () {
  fu("warn", arguments);
};
console.info = function () {
  fu("info", arguments);
};
console.error = function () {
  fu("error", arguments);
}; */

console.log('YuriNET Dedicated Server v1 - NODEJS');
console.log('====================================');
console.log();
console.log('Initializing server...');

// Add listener events.
server.on('error', (err) => {
  console.log(`server error:\n${err.stack}`);
  server.close();
});

server.on('listening', (udpServer) => {
  var address = udpServer.address();
  console.log(`Server started. And listening ${address.address}:${address.port}...`);

  // Show prompt.
  /* rl.setPrompt('> ');
  rl.prompt(); */
});

server.on('lobby.chat', (name, message) => {
  console.log(` [Lobby] > ${name} : ${message}`);

  socketCtrl.emitLobbyMessage({
    name,
    message,
    timestamp: new Date().toISOString(),
  });
});

server.on('close', () => {
  console.log('Server is shutted down.');
  // rl.close();
});

// Input
/* rl.on('line', (line) => {
  line = line.trim();
  if (line != '') {
    let args = line.split(' ');

    switch (args[0].trim()) {
      case 'hi':
        console.log('Hello !!');
        break;

      case 'count':
      case 'online':
      case 'useronline':
        if (args[1] == 'detail') {
          console.log(`All clients detail here : \n${JSON.stringify(server._clients, null, 2)}`);
        }
        console.log(`There are ${server.clientCount} online.`);
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
        server.stopServer(true);
        rl.close();
      } else if (ans.trim() == '2') {
        console.log('Server stopped when all players are leaved.');
        server.stopServer();
      } else {
        console.log('Cancelled');
      }

      rl.prompt();
    });
}); */

/**
 * Clone Array.
 */
Array.clone = function (oldArr) {
  let newArr = new Array(oldArr.length),
    i = oldArr.length;
  while (i--) {
    newArr[i] = oldArr[i];
  }

  return newArr;
};




// Initialize Express
wapp.get('/', (req, res) => {
  res.send('YuriNET Hello !');
});

wapp.get('/info', (req, res) => {
  let strReturn = JSON.stringify({
    serverstate: 'online',
    servername: 'NODEJS',
    serverport: config.port,
    launchedon: server.startedAt,
    maxclients: config.maxClients,
    peekclients: server.peekClient,
    clientcount: server.clientCount,
    clients: (function () {
      let clientsArr = [];
      let clientsIpList = server.clientsMapIp;
      console.log('/info clientsIpList : ', clientsIpList);
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
  res.send(strReturn);
});

// Bind Web Application
httpServer.listen(config.port, () => {
  console.log(`Web application listening on port ${config.port}`);
});

server.startServer();
