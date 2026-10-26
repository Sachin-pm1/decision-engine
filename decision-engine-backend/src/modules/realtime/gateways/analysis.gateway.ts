import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { AnalysisService } from '../../analysis/services/analysis.service';
import { AnalysisStep } from '../../analysis/entities/analysis.entity';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://52.66.249.234'],
    credentials: true,
  },
  namespace: 'analysis',
})
export class AnalysisGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AnalysisGateway.name);
  private readonly connectedClients: Map<string, Socket> = new Map();

  constructor(
    @Inject(forwardRef(() => AnalysisService))
    private readonly analysisService: AnalysisService,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    this.logger.log(`Client handshake: ${JSON.stringify(client.handshake)}`);
    this.connectedClients.set(client.id, client);
    
    // Send welcome message
    client.emit('connected', {
      message: 'Connected to Decision Engine Analysis Gateway',
      clientId: client.id,
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(client: Socket, payload: { analysisId: string }) {
    const { analysisId } = payload;
    
    if (!analysisId) {
      this.logger.warn(`Client ${client.id} tried to subscribe without analysisId`);
      return;
    }
    
    client.join(`analysis:${analysisId}`);
    this.logger.log(`Client ${client.id} subscribed to analysis: ${analysisId}`);
    
    client.emit('subscribed', {
      analysisId,
      message: `Subscribed to analysis updates for ${analysisId}`,
    });
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(client: Socket, payload: { analysisId: string }) {
    const { analysisId } = payload;
    
    client.leave(`analysis:${analysisId}`);
    this.logger.log(`Client ${client.id} unsubscribed from analysis: ${analysisId}`);
    
    client.emit('unsubscribed', {
      analysisId,
      message: `Unsubscribed from analysis updates for ${analysisId}`,
    });
  }

  @SubscribeMessage('start_analysis')
  async handleStartAnalysis(client: Socket, payload: { intentId: string }) {
    try {
      const analysis = await this.analysisService.startAnalysis(payload.intentId);
      
      // Auto-subscribe client to this analysis
      client.join(`analysis:${analysis.id}`);
      
      client.emit('analysis_started', {
        analysisId: analysis.id,
        intentId: payload.intentId,
        status: 'analyzing',
      });
    } catch (error) {
      client.emit('error', {
        message: 'Failed to start analysis',
        error: error.message,
      });
    }
  }

  // Broadcast methods for the AnalysisService to use
  broadcastProgress(analysisId: string, progress: {
    step: AnalysisStep;
    percentage: number;
    message: string;
    timestamp: Date;
  }) {
    const room = `analysis:${analysisId}`;
    
    this.server.to(room).emit('analysis_progress', {
      analysisId,
      ...progress,
      stepName: this.getStepName(progress.step),
    });

    this.logger.debug(`Progress broadcast for ${analysisId}: ${progress.percentage}%`);
  }

  broadcastAnalysisComplete(analysisId: string, result: {
    recommendations: any[];
    recommendedOption: string;
    complexity: string;
    category: string;
    steps: string[];
  }) {
    const room = `analysis:${analysisId}`;
    
    this.server.to(room).emit('analysis_complete', {
      analysisId,
      status: 'completed',
      timestamp: new Date(),
      result,
    });

    this.logger.log(`Analysis complete broadcast for ${analysisId}`);
  }

  broadcastAnalysisError(analysisId: string, error: string) {
    const room = `analysis:${analysisId}`;

    this.server.to(room).emit('analysis_error', {
      analysisId,
      status: 'failed',
      error: error || 'Analysis failed',
      timestamp: new Date(),
    });

    this.logger.error(`Analysis error broadcast for ${analysisId}: ${error}`);
  }

  private getStepName(step: AnalysisStep): string {
    const stepNames: Record<AnalysisStep, string> = {
      [AnalysisStep.INTENT_UNDERSTANDING]: 'Understanding Intent',
      [AnalysisStep.COMPLEXITY_ANALYSIS]: 'Analyzing Complexity',
      [AnalysisStep.APPROACH_COMPARISON]: 'Comparing Approaches',
      [AnalysisStep.RECOMMENDATION_GENERATION]: 'Generating Recommendation',
    };
    return stepNames[step] || step;
  }

  // Health check
  @SubscribeMessage('ping')
  handlePing(client: Socket) {
    client.emit('pong', {
      timestamp: new Date().toISOString(),
      activeConnections: this.connectedClients.size,
    });
  }
}
