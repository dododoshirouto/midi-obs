// Reference: https://gist.github.com/lee-brown/70e6014a903dfea9e2dfe7e35fc8ab88
// Reference: https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md

/**
 * WebSocket Controller
 */
class WebSocketController {
    /**
     * @type {WebSocketController}
     */
    static instance;

    /**
     * @type {string} - Host Address.
     */
    __host_address = '';

    /**
     * @type {WebSocket} - WebSocket Connection.
     */
    __connection = null;

    /**
     * @type {string} - WebSocket Version.
     */
    __obs_ws_version = '';
    /**
     * @type {string} - WebSocket RPC Version.
     */
    __rpc_version = 0;

    /**
     * constructor.
     * @param {string} host - Host Address.
     */
    constructor(host, port) {
        WebSocketController.instance = this;

        this.__host_address = host + (port ? ':' + port : '');
        this.open();

        // this.__connection.onopen = this.onconnectionopen;
        this.__connection.addEventListener('open', this.onconnectionopen);
        // this.__connection.onerror = this.onconnectionerror;
        this.__connection.addEventListener('error', this.onconnectionerror);
        // this.__connection.onmessage = this.onconnectionmessage;
        this.__connection.addEventListener('message', this.onconnectionmessage);
        // this.__connection.onclose = this.onconnectionclose;
        this.__connection.addEventListener('close', this.onconnectionclose);
    }

    onconnectionopen(...args) {
        console.log('WebSocket: connection open', args);
    }

    onconnectionerror(...args) {
        console.log('WebSocket: connection error', args);
    }

    onconnectionmessage(ev, ...args) {
        console.log('WebSocket: connection message', [ev, ...args]);

        const wsc = WebSocketController.instance;

        let data = ev.data;
        if (data) data = JSON.parse(data);

        let requestStatus = data.d.requestStatus;
        console.log('WebSocket: message', data, requestStatus);

        wsc.__obs_ws_version = data.d.obsWebSocketVersion || wsc.__obs_ws_version;
        wsc.__rpc_version = data.d.rpcVersion || wsc.__rpc_version;

        if (typeof data.op != 'number') {
            console.log('WebSocket: Unknown message', ev, ev.currentTarget, data);
            return;
        }

        if (data.op == 0) {
            console.log('WebSocket: Hello client from OBS.');
            wsc.sendOBS(1);
        } else if (data.op == 5) {
            // Get Events
        } else if (data.op == 7) {
            // Get Response
            let response = data.d.responseData;
            console.log('WebSocket: Get Response', response);
        } else {
            console.log('WebSocket: Get message', ev, ev.currentTarget, data);
        }
    }

    onconnectionclose(...args) {
        console.log('WebSocket: connection close', args);
    }

    /**
     * @param {number} opcode - Opcode.
     * @param {string} type - Type.
     * @param {Object(key, value)} fields - Request fields.
     */
    sendOBS(opcode, type, fields) {
        let data = {};

        if (opcode == 1) {
            data.rpcVersion = this.__rpc_version;
        }
        // if (opcode == 5) {
        //     data.eventType = type;
        //     data.eventIntent = 1;
        //     data.eventData = {};
        //     Object.assign(data, fields);
        // } else
        else if (opcode == 6) {
            data.requestType = type;
            // data.requestId = 'f819dcf0-89cc-11eb-8f0e-382c4ac93b9c';
            data.requestId = Math.floor(Math.random() * Math.pow(16, 12)).toString(16);
            data.requestData = {};
            Object.assign(data, fields);
        }

        console.log('WebSocket: send', opcode, data);

        this.__connection.send(
            JSON.stringify({
                op: opcode,
                d: data,
            })
        );
    }

    // /**
    //  * @param {string} type
    //  * @param {string} key
    //  * @param {string} value
    //  */
    // sendEvent(type, key, value) {
    //     this.sendOBS(5, type, key, value);
    // }

    /**
     * @param {string} type
     * @param {string} key
     * @param {string} value
     */
    sendRequest(type, fields) {
        this.sendOBS(6, type, fields);
    }

    open() {
        this.close();
        this.__connection = new WebSocket(`ws://${this.__host_address}`, 'obswebsocket.json');
    }

    close() {
        if (this.__connection && this.__connection.readyState == WebSocket.OPEN) this.__connection.close();
    }
}
