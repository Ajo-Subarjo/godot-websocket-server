import asyncio
import websockets
import os

PORT = int(os.environ.get("PORT", 8000))
clients = set()

async def handler(websocket, path=None):
    clients.add(websocket)
    print(f"Player connected. Total: {len(clients)}")
    try:
        async for message in websocket:
            for client in clients:
                if client.open:
                    await client.send(message)
    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        clients.discard(websocket)
        print(f"Player disconnected. Total: {len(clients)}")

async def main():
    print(f"Starting server on 0.0.0.0:{PORT}")
    async with websockets.serve(handler, "0.0.0.0", PORT):
        await asyncio.Future()

asyncio.run(main())
# ```

# Push ke GitHub, redeploy, lalu cek log Railway — harus muncul:
# ```
# Starting server on 0.0.0.0:XXXX