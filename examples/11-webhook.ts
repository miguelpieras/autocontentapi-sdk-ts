import { createServer } from 'node:http';
import AutoContent from 'autocontentapi';

createServer(async (request, response) => {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(chunk);
  try {
    const event = AutoContent.webhooks.constructEvent({
      rawBody: Buffer.concat(chunks),
      signature: request.headers['x-autocontent-signature'],
      eventId: request.headers['x-autocontent-event-id'],
      secret: process.env.AUTOCONTENT_WEBHOOK_SECRET ?? ''
    });
    console.log(event.type, event.data);
    response.writeHead(204).end();
  } catch {
    response.writeHead(400).end();
  }
}).listen(3000);
