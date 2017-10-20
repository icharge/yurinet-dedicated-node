const { Client } = require('./client');

exports.ClientSeeker = class ClientSeeker {

  /**
   * 
   * @param {{[id: number]: Client}} clientList Client Map.
   * @param {{[address: string]: Client}} clientListIp Client Map with IP address.
   * @param {number} max Max clients.
   */
  constructor(clientList, clientListIp, max) {
    this._currentIndex = 0;
    this._clientCount = 0;
    this._clientsMap = clientList || {};
    this._clientsMapIp = clientListIp || {};
    this._max = max;
  }

  getClientCount() {
    return this._clientCount;
  }

  getClientsMap() {
    return this._clientsMap;
  }

  getClientsMapIp() {
    return this._clientsMapIp;
  }

  /**
   * Get Client by ID.
   * 
   * @param {number} id Client ID.
   */
  getClientById(id) {
    return this._clientsMap[id];
  }

  /**
   * Get Client By IP (address:port)
   * 
   * @param {string} address Remote address : port.
   */
  getClientByIp(address) {
    return this._clientsMapIp[address];
  }

  findFreeSlot() {
    let client = -1;
    for (let c = 0; c < this._max; this._currentIndex++ , c++) {
      if (this._currentIndex > this._max) {
        this._currentIndex = 0;
      }

      if (this._clientsMap[this._currentIndex] == null) {
        client = this._currentIndex;
        break;
      }
    }
    return client;
  }

  addClient(client) {
    if (client != null) {
      let addr = client.connection.address + ':' + client.connection.port;
      this._clientsMap[client.id] = client;
      this._clientsMapIp[addr] = client;
      this._clientCount++;

      console.log(`Added client #${client.id} from ${addr}`);
    }
  }

  removeClient(id) {
    let client = clientList[id];
    if (null != client) {
      let addr = client.connection.address + ':' + client.connection.port;
      this._clientsMap[id] = null;
      // this._clientsMapIp[addr] = null;
      delete this._clientsMapIp[addr];
      this._clientCount--;

      console.log(`Removed client #${id} from ${addr}`);
    }
  }

  removeClientByIp(ip, port) {
    let addr = ip + ':' + port;
    let client = this._clientsMapIp[addr];
    if (null != client) {
      this._clientsMap[client.id] = null;
      // this._clientsMapIp[addr] = null;
      delete this._clientsMapIp[addr];
      this._clientCount--;

      console.log(`Removed client #${client.id} by IP:Port ${addr}`);
    }

    client = null;
  }

}