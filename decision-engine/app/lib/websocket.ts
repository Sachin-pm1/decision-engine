import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';

export class AnalysisWebSocket {
  private socket: Socket | null = null;
  private analysisId: string | null = null;

  connect() {
    if (this.socket?.connected) return;

    const fullUrl = `${WS_URL}/analysis`;
    console.log('Connecting to Analysis WebSocket:', fullUrl);
    this.socket = io(fullUrl, {
      transports: ['websocket'],
      reconnection: true,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connect_error:', error.message);
    });

    this.socket.on('error', (error: any) => {
      console.error('WebSocket error:', error);
    });
  }

  disconnect() {
    if (this.analysisId) {
      this.socket?.emit('unsubscribe', { analysisId: this.analysisId });
    }
    this.socket?.disconnect();
    this.socket = null;
    this.analysisId = null;
  }

  subscribe(analysisId: string) {
    if (!analysisId) {
      console.error('Cannot subscribe: analysisId is undefined');
      return;
    }
    this.connect();
    this.analysisId = analysisId;
    if (this.socket?.connected) {
      this.socket.emit('subscribe', { analysisId });
    } else {
      this.socket?.on('connect', () => {
        this.socket?.emit('subscribe', { analysisId });
      });
    }
  }

  unsubscribe(analysisId: string) {
    this.socket?.emit('unsubscribe', { analysisId });
    if (this.analysisId === analysisId) {
      this.analysisId = null;
    }
  }

  onProgress(callback: (data: any) => void) {
    this.socket?.on('analysis_progress', callback);
  }

  onComplete(callback: (data: any) => void) {
    this.socket?.on('analysis_complete', callback);
  }

  onError(callback: (data: any) => void) {
    this.socket?.on('analysis_error', (data) => {
      console.log('Raw analysis_error event received:', data);
      callback(data);
    });
  }

  removeAllListeners() {
    this.socket?.off('analysis_progress');
    this.socket?.off('analysis_complete');
    this.socket?.off('analysis_error');
  }
}

export const ws = new AnalysisWebSocket();

export class ExecutionWebSocket {
  private socket: Socket | null = null;
  private executionId: string | null = null;

  connect() {
    if (this.socket?.connected) {
      console.log('Execution WebSocket already connected');
      return;
    }

    console.log('Connecting to Execution WebSocket:', WS_URL);
    const fullUrl = `${WS_URL}/execution`;
    console.log('Connecting to Execution WebSocket:', fullUrl);
    this.socket = io(fullUrl, {
      transports: ['websocket'],
      reconnection: true,
    });

    this.socket.on('connect', () => {
      console.log('Execution WebSocket connected, socket id:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Execution WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Execution WebSocket connection error:', error);
    });

    this.socket.on('error', (error: any) => {
      console.error('Execution WebSocket error:', error);
    });
  }

  disconnect() {
    if (this.executionId) {
      this.socket?.emit('unsubscribe', { executionId: this.executionId });
    }
    this.socket?.disconnect();
    this.socket = null;
    this.executionId = null;
  }

  subscribe(executionId: string) {
    if (!executionId) {
      console.error('Cannot subscribe: executionId is undefined');
      return;
    }
    console.log('Subscribing to execution:', executionId);
    this.connect();
    this.executionId = executionId;
    
    const doSubscribe = () => {
      console.log('Emitting subscribe event for execution:', executionId);
      this.socket?.emit('subscribe', { executionId });
    };
    
    if (this.socket?.connected) {
      doSubscribe();
    } else {
      this.socket?.on('connect', () => {
        console.log('Socket connected, now subscribing to execution:', executionId);
        doSubscribe();
      });
    }
  }

  unsubscribe(executionId: string) {
    this.socket?.emit('unsubscribe', { executionId });
    if (this.executionId === executionId) {
      this.executionId = null;
    }
  }

  onStart(callback: (data: any) => void) {
    console.log('Registering execution:start handler');
    this.socket?.on('execution:start', (data) => {
      console.log('Received execution:start event:', data);
      callback(data);
    });
  }

  onProgress(callback: (data: any) => void) {
    console.log('Registering execution:progress handler');
    this.socket?.on('execution:progress', (data) => {
      console.log('Received execution:progress event:', data);
      callback(data);
    });
  }

  onComplete(callback: (data: any) => void) {
    console.log('Registering execution:complete handler');
    this.socket?.on('execution:complete', (data) => {
      console.log('Received execution:complete event:', data);
      callback(data);
    });
  }

  onError(callback: (data: any) => void) {
    console.log('Registering execution:error handler');
    this.socket?.on('execution:error', (data) => {
      console.log('Received execution:error event:', data);
      callback(data);
    });
  }

  removeAllListeners() {
    this.socket?.off('execution:start');
    this.socket?.off('execution:progress');
    this.socket?.off('execution:complete');
    this.socket?.off('execution:error');
  }
}

export const executionWs = new ExecutionWebSocket();
