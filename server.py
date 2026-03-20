import asyncio
import websockets
import os

PORT = int(os.environ.get("PORT", 8000))
clients = set()

async def handler(websocket):
    clients.add(websocket)
    print(f"Player connected. Total: {len(clients)}")
    try:
        async for message in websocket:
            # Broadcast ke semua client
            for client in clients:
                if client.open:
                    await client.send(message)
    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        clients.discard(websocket)
        print(f"Player disconnected. Total: {len(clients)}")

async def main():
    async with websockets.serve(handler, "0.0.0.0", PORT):
        print(f"Server running on port {PORT}")
        await asyncio.Future()  # jalan selamanya

asyncio.run(main())
