import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ExecutionStatus } from '../entities/execution.entity';

interface ExecutionStartData {
  approach: string;
  intentText: string;
}

interface ExecutionProgressData {
  step: number;
  totalSteps: number;
  status: ExecutionStatus;
  currentStepDescription?: string;
  output?: string;
  percentage: number;
}

interface ExecutionCompleteData {
  result: string;
  steps?: {
    step: number;
    description: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    output?: string;
  }[];
  metadata?: {
    tokenUsage: number;
    executionTime: number;
    modelUsed: string;
  };
}

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://52.66.249.234'],
    credentials: true,
  },
  namespace: 'execution',
})
export class ExecutionGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ExecutionGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(client: Socket, payload: { executionId: string }) {
    const { executionId } = payload;
    if (executionId) {
      client.join(executionId);
      this.logger.log(`Client ${client.id} subscribed to execution: ${executionId}`);
    }
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(client: Socket, payload: { executionId: string }) {
    const { executionId } = payload;
    if (executionId) {
      client.leave(executionId);
      this.logger.log(`Client ${client.id} unsubscribed from execution: ${executionId}`);
    }
  }

  subscribe(executionId: string, client: Socket) {
    client.join(executionId);
    this.logger.log(`Client ${client.id} subscribed to execution: ${executionId}`);
  }

  unsubscribe(executionId: string, client: Socket) {
    client.leave(executionId);
    this.logger.log(`Client ${client.id} unsubscribed from execution: ${executionId}`);
  }

  broadcastExecutionStart(executionId: string, data: ExecutionStartData) {
    this.logger.log(`Broadcasting execution:start to room ${executionId}`);
    this.server.to(executionId).emit('execution:start', {
      executionId,
      ...data,
      timestamp: new Date(),
    });
  }

  broadcastExecutionProgress(executionId: string, data: ExecutionProgressData) {
    this.logger.log(`Broadcasting execution:progress to room ${executionId}`);
    this.server.to(executionId).emit('execution:progress', {
      executionId,
      ...data,
      timestamp: new Date(),
    });
  }

  broadcastExecutionComplete(executionId: string, data: ExecutionCompleteData) {
    this.logger.log(`Broadcasting execution:complete to room ${executionId}`);
    this.server.to(executionId).emit('execution:complete', {
      executionId,
      ...data,
      timestamp: new Date(),
    });
  }

  broadcastExecutionError(executionId: string, error: string) {
    this.logger.log(`Broadcasting execution:error to room ${executionId}`);
    this.server.to(executionId).emit('execution:error', {
      executionId,
      error,
      timestamp: new Date(),
    });
  }
}
