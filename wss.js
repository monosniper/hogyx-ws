const {WebSocketServer} = require("ws");
// const {createServer} = require("http");
const {createServer} = require("https");
const api = require("./api");
const {check_interval} = require("./config");
const Miner = require("./miner");
const {readFileSync} = require("fs");

try {
    const privateKey = readFileSync('privkey.pem', 'utf8');
    const certificate = readFileSync('fullchain.pem', 'utf8');
} catch (e) {
    console.error('Can\'t find cert files')
}

// const server = createServer()
const server = createServer({ key: privateKey, cert: certificate });
const wss = new WebSocketServer({ noServer: true });

console.log("started web socket server...")

const send = (ws, message, data = {}) => ws.send(JSON.stringify({
    message, data
}))

const methods = {
    start: (data, ws, client) => {
        if (data.coins && data.servers) {
            api("sessions/start", {
                user_id: client,
                ...data
            }).then(rs => {
                if (rs.success) {
                    new Miner(
                        rs.data,
                        (updated_session_data, url=undefined) => api(
                            url ?? "sessions/" + rs.data.id,
                            updated_session_data,
                            "put"
                        ),
                        () => send(ws, "started", {session_id: rs.data.id})
                    )
                } else send(ws, "error", {"description": rs})
            })
        } else send(ws, "error", {"description": "Coins or servers array is empty"})
    },
    _stop: (data, ws) => {
        api(`sessions/${data.session_id}/stop`, false, 'delete').then(rs => {
            send(ws, "success", rs)
        }).catch(err => console.error(err))
    },
    connect: (data, ws, client) => {
        function check() {
            api("sessions/" + data.session_id, false, 'get').then(rs => {
                send(ws, "update", rs)

                setTimeout(check, check_interval)
            }).catch(err => console.error(err))
        }

        check()
    },
}

const messageHandler = (data, ws, client) => {
    try {
        data = JSON.parse(data)
        methods[data.method](data.data, ws, client)
    } catch (e) {
    }
}

const authenticate = (request, callback) => {
    const query = request.url?.split('/?')[1]?.split('=')

    if (query && query[0] === 'token') {
        api("check", {token: query[1]}).then(rs => {
            rs.success ? callback(false, rs.user_id) : callback(true)
        })
    } else callback(true)
}

server.on('upgrade', function upgrade(request, socket, head) {
    socket.on('error', console.error);

    // This function is not defined on purpose. Implement it with your own logic.
    authenticate(request, function next(err, client) {
        if (err || !client) {
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
            socket.destroy();
            return;
        }

        socket.removeListener('error', console.error);

        wss.handleUpgrade(request, socket, head, function done(ws) {
            wss.emit('connection', ws, request, client);
        });
    });
});

wss.on('connection', function connection(ws, request, client) {
    ws.on('error', console.error);
    ws.on('message', (data) => messageHandler(data, ws, client));
});

module.exports = server