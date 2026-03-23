const WebSocket = require('ws');
const PORT = process.env.PORT || 8080;
const { randomUUID } = require('crypto');
const { send } = require('process');

const wss = new WebSocket.Server({ port: PORT });
const clients = new Map();

wss.on('connection', (ws) => {

    ws.on('message', (message) => {
        handle_data(ws, message)
    })

    ws.on('close', () => {
        if (ws.id) {
            clients.delete(ws.id)
            broadcast(null, { type: "leave", id: ws.id })
            console.log('Player disconnected. Total:', clients.size)
        }
    })
})



function handle_data(ws, message) {
    let data
    try {
        data = JSON.parse(message)
    } catch (e) {
        console.log("Bukan JSON:", message.toString())
        return
    }

    if (!ws.id && data.type !== "setid") return

    switch (data.type) {
        case "setid":
            // Cek ID sudah dipakai
            if (clients.has(data.id)) {
                console.log("error{5} Id ada yang sama", data.id)
                ws.send(JSON.stringify({ type: "error", message: "ID sudah dipakai", error_kode: 5 }))
                return
            }
            ws.id = data.id
            clients.set(ws.id, ws)
            ws.send(JSON.stringify({ type: "welcome", id: ws.id }))
            broadcast(ws, { type: "join", id: ws.id })
            console.log('Player joined:', ws.id, '| Total:', clients.size)
            break

        case "get_all_connected_player":
            const existing = []
            for (const [id, client] of clients) {
                if (id !== ws.id) existing.push(id)
            }
            send_to(ws, { type: "existing_players", players: existing })
            console.log("sending all connected players to", existing , ws.id)
            break

        case "puppet_update":
            data.id = ws.id
            broadcast(ws, data)
            // console.log("recieved player update data: ", data.id)
            break

        case "chat":
            console.log(ws.id)
            data.id = ws.id
            broadcast(ws, data)
            break

        case "ping":
            send_to(ws, { type: "pong" })
            break
            

        default:
            console.log("Tipe tidak dikenal:", data.type)
    }
}


function send_to(destination, data) {
    destination.send(JSON.stringify(data))
}

function broadcast(exclude, data) {
    for (const [id, client] of clients) {
        if (client !== exclude && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data))
        }
    }
}

console.log('Server running on port', PORT)