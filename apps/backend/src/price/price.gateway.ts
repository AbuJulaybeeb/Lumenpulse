import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Inject, forwardRef } from '@nestjs/common';
import { PriceService } from './price.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class PriceGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    @Inject(forwardRef(() => PriceService))
    private readonly priceService: PriceService,
  ) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @MessageBody() data: { pair: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = data.pair.replace('/', '_');

    client.join(room);

    return {
      event: 'subscribed',
      data: { room },
    };
  }

  // 🔥 Used by service to push updates
  sendPriceUpdate(pair: string, payload: any) {
    const room = pair.replace('/', '_');
    this.server.to(room).emit('priceUpdate', payload);
  }
}