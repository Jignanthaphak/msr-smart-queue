// app/api/queue/stream/route.js
"use server";
import "server-only";
import { getQueueData } from "@/app/api/queue/state/route";

if (!global.queueClients) {
  global.queueClients = [];
}

export async function GET(req) {
  try {
    return new Response(
      new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          const write = (msg) => controller.enqueue(encoder.encode(msg));

          const client = { write, close: () => controller.close() };
          global.queueClients.push(client);

          // 1) Send initial state immediately upon connection
          try {
            const data = await getQueueData();
            if (data) {
              client.write(`data: ${JSON.stringify({ type: "init", payload: data })}\n\n`);
            }
          } catch (err) {
            console.error("SSE /api/queue/stream initial error:", err);
          }

          // 2) Heartbeat every 25 seconds
          const intervalId = setInterval(() => {
            try {
              client.write(`: ping ${Date.now()}\n\n`);
            } catch (e) {
              console.error("SSE heartbeat error:", e);
            }
          }, 25000);

          // 3) Handle client disconnection
          req.signal.addEventListener("abort", () => {
            const index = global.queueClients.indexOf(client);
            if (index > -1) global.queueClients.splice(index, 1);
            clearInterval(intervalId);
            client.close();
          });
        },
      }),
      {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      }
    );
  } catch (err) {
    console.error("GET /api/queue/stream error:", err);
    return new Response(JSON.stringify({ error: err.message || "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
