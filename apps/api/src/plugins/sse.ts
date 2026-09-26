import type { FastifyReply } from "fastify";
import fp from "fastify-plugin";

export interface SseEvent {
  event: string;
  data: unknown;
}

export interface SseStream {
  send(event: SseEvent): void;
  /** Sends `event: done` and ends the response. */
  close(): void;
  /** True once the client has gone away (section 25: the turn continues anyway). */
  readonly closed: boolean;
}

const KEEPALIVE_MS = 15_000;

declare module "fastify" {
  interface FastifyReply {
    sse(): SseStream;
  }
}

/**
 * Minimal SSE writer for build progress and chat turns (sections 18.5, 21).
 * Takes the socket over with `hijack()` so Fastify does not try to serialise a
 * body afterwards.
 */
export function openSseStream(reply: FastifyReply): SseStream {
  let closed = false;

  reply.hijack();
  reply.raw.writeHead(200, {
    "content-type": "text/event-stream",
    "cache-control": "no-cache, no-transform",
    connection: "keep-alive",
    // Without this, a buffering proxy defeats streaming entirely.
    "x-accel-buffering": "no",
  });

  const keepalive = setInterval(() => {
    if (!closed) reply.raw.write(": keepalive\n\n");
  }, KEEPALIVE_MS);
  keepalive.unref?.();

  const markClosed = () => {
    if (closed) return;
    closed = true;
    clearInterval(keepalive);
  };

  reply.raw.on("close", markClosed);

  return {
    send({ event, data }) {
      if (closed) return;
      reply.raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    },
    close() {
      if (closed) return;
      reply.raw.write("event: done\ndata: {}\n\n");
      markClosed();
      reply.raw.end();
    },
    get closed() {
      return closed;
    },
  };
}

export default fp(
  async (app) => {
    app.decorateReply("sse", function sse(this: FastifyReply) {
      return openSseStream(this);
    });
  },
  { name: "sse" },
);
