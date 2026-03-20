const WebSocket = require('ws');
const PORT = process.env.PORT || 8080;
const { randomUUID } = require('crypto');

const wss = new WebSocket.Server({ port: PORT });
const clients = new Map();

wss.on('connection', (ws) => {

    ws.on('message', (message) => {
        handle_data(ws, message)
    })

    ws.on('close', () => {
        if (ws.id) {
            clients.delete(ws.id)
            broadcast({ type: "leave", id: ws.id }, null)
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
            broadcast({ type: "join", id: ws.id }, ws)
            console.log('Player joined:', ws.id, '| Total:', clients.size)
            break

        case "player_update":
            if (!ws.id) return
            data.id = ws.id
            broadcast(data, ws)
            break

        case "chat":
            if (!ws.id) return
            data.id = ws.id
            broadcast(data, null)
            break
        case "ping":
            ws.send(JSON.stringify({ type: "pong" }))
            break
        default:
            console.log("Tipe tidak dikenal:", data.type)
    }
}

function broadcast(data, exclude) {
    for (const [id, client] of clients) {
        if (client !== exclude && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data))
        }
    }
}

console.log('Server running on port', PORT)