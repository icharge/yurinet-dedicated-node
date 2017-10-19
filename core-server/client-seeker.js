import * as Client from './client';

module.exports = class ClientSeeker {

  /**
   * Current pointer to slot of Clients.
   * 
   * @type {number}
   */
  _index = 0;

  /**
   * Client Map.
   * 
   * @type {{[id: number]: Client}}
   */
  _clientsMap;

  /**
   * Client Map with IP address.
   * 
   * @type {{[address: string]: Client}}
   */
  _clientsMapIp;

  /**
   * Client count.
   * 
   * @type {number}
   */
  _clientCount = 0;

  /**
   * Max client.
   * 
   * @type {number}
   */
  _max = 0

  constructor(clientList, clientListIp, max) {
    this._clientsMap = clientList;
    this._clientsMapIp = clientListIp;
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
    for (; c < this._max; this._index++) {
      if (index > max) {
        index = 0;
      }

      if (null == clients[index]) {
        client = index;
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
      this._clientsMapIp[addr] = null;

      console.log(`Removed client #${id} from ${addr}`);
    }
  }

  removeClientByIp(ip, port) {
    let addr = ip + ':' + port;
    let client = this._clientsMapIp[addr];
    if (null != client) {
      this._clientsMap[client.id] = null;
      this._clientsMapIp[addr] = null;
      this._clientCount--;

      console.log(`Removed client #${client.id} by IP:Port ${addr}`);
    }

    client = null;
  }

}