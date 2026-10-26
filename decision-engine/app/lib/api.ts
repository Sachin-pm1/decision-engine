const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    image: string | null;
  };
  accessToken: string;
  refreshToken: string;
}

export interface Intent {
  id: string;
  text: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Analysis {
  id: string;
  intentId: string;
  complexity: string;
  category: string;
  progress: {
    currentStep: string;
    completedSteps: string[];
    percentage: number;
  };
  isComplete: boolean;
  createdAt: string;
}

export interface Recommendation {
  id: string;
  analysisId: string;
  approachType: string;
  name: string;
  description: string;
  estimatedTime: string;
  tokenUsage: number;
  quality: string;
  confidence: number;
  pros: string[];
  cons: string[];
  isRecommended: boolean;
  predictionMetrics: {
    latencyMs: number;
    costEstimate: number;
    successProbability: number;
    qualityScore: number;
  };
}

class ApiClient {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('accessToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private handleUnauthorized(): void {
    // Clear all auth data
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    // Check for 401 Unauthorized
    if (response.status === 401) {
      this.handleUnauthorized();
      throw new Error('Session expired. Please sign in again.');
    }
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json() as Promise<ApiResponse<T>>;
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return this.handleResponse<T>(response);
  }

  async delete(endpoint: string): Promise<void> {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    
    if (response.status === 401) {
      this.handleUnauthorized();
      throw new Error('Session expired. Please sign in again.');
    }
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  // Auth endpoints
  async register(email: string, password: string, name?: string): Promise<AuthResponse> {
    const response = await this.post<AuthResponse>('/auth/register', { email, password, name });
    const data = (response as any).data || response;
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.post<AuthResponse>('/auth/login', { email, password });
    console.log('Login response:', response);
    const data = (response as any).data || response;
    console.log('Extracted data:', data);
    console.log('accessToken:', data.accessToken);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  }

  async logout(): Promise<void> {
    await this.post('/auth/logout', {});
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  async getProfile() {
    const response = await this.get('/auth/me');
    return (response as any).data || response;
  }

  // Intent endpoints
  async createIntent(text: string, sessionId?: string): Promise<Intent> {
    const response = await this.post<Intent>('/intents', { text, sessionId });
    return (response as any).data || response;
  }

  async getIntent(id: string): Promise<Intent> {
    const response = await this.get<Intent>(`/intents/${id}`);
    return (response as any).data || response;
  }

  async getIntentsBySession(sessionId: string): Promise<Intent[]> {
    const response = await this.get<Intent[]>(`/intents/session/${sessionId}`);
    return (response as any).data || response;
  }

  // Analysis endpoints
  async startAnalysis(intentId: string): Promise<{ analysisId: string; intentId: string; status: string }> {
    const response = await this.post('/analysis/start', { intentId });
    return (response as any).data || response;
  }

  async getAnalysis(id: string): Promise<Analysis> {
    const response = await this.get<Analysis>(`/analysis/${id}`);
    return (response as any).data || response;
  }

  async getAnalysisByIntent(intentId: string): Promise<Analysis | null> {
    const response = await this.get<Analysis | null>(`/analysis/intent/${intentId}`);
    return (response as any).data || response;
  }

  // Recommendation endpoints
  async getRecommendations(analysisId: string): Promise<Recommendation[]> {
    const response = await this.get<Recommendation[]>(`/recommendations/analysis/${analysisId}`);
    return (response as any).data || response;
  }

  // History endpoints
  async getHistory(): Promise<HistoryItem[]> {
    const response = await this.get<HistoryItem[]>('/history');
    return (response as any).data || response;
  }

  async getHistoryItem(id: string): Promise<HistoryItemDetail> {
    const response = await this.get<HistoryItemDetail>(`/history/${id}`);
    return (response as any).data || response;
  }

  async deleteHistoryItem(id: string): Promise<void> {
    await this.delete(`/history/${id}`);
  }

  // Execution endpoints
  async createExecution(analysisId: string, approach: string, intentText: string, customPrompt?: string): Promise<Execution> {
    const response = await this.post<Execution>('/executions', { analysisId, approach, intentText, customPrompt });
    return (response as any).data || response;
  }

  async getExecution(id: string): Promise<Execution> {
    const response = await this.get<Execution>(`/executions/${id}`);
    return (response as any).data || response;
  }

  async getExecutionsByAnalysis(analysisId: string): Promise<Execution[]> {
    const response = await this.get<Execution[]>(`/executions/analysis/${analysisId}`);
    return (response as any).data || response;
  }
}

export interface HistoryItem {
  id: string;
  intent: string;
  complexity: 'low' | 'medium' | 'high';
  category: string;
  recommended: 'simple' | 'workflow' | 'agent';
  date: string;
  status: string;
  isComplete: boolean;
}

export interface HistoryItemDetail extends HistoryItem {
  options: Recommendation[];
  executions?: {
    id: string;
    approach: 'simple' | 'workflow' | 'agent';
    status: string;
    result?: string;
    metadata?: {
      tokenUsage: number;
      executionTime: number;
      modelUsed: string;
    };
    createdAt: string;
  }[];
}

export interface Execution {
  id: string;
  analysisId: string;
  approach: 'simple' | 'workflow' | 'agent';
  intentText: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: string;
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
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export const api = new ApiClient();
