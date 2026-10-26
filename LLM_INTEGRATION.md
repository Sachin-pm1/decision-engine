# LLM Integration Guide

## Current Implementation: Mock Analysis

The current implementation uses **keyword-based analysis** without requiring any LLM API keys. This is suitable for:
- Development and testing
- Demo purposes
- Basic complexity detection

### How It Works

The system analyzes user intent using predefined keyword patterns:

```typescript
private readonly complexityKeywords = {
  high: ['build', 'create', 'develop', 'system', 'app', 'application', 'platform'],
  medium: ['analyze', 'report', 'summarize', 'process', 'automate', 'workflow'],
  low: ['write', 'explain', 'help', 'what', 'how', 'define'],
};
```

## Production Implementation: Real LLM Integration

For production use, you should integrate with an LLM API for better intent understanding.

### Option 1: Anthropic Claude API

**API Key Required:** Yes

```bash
# Add to .env file
ANTHROPIC_API_KEY=your_api_key_here
```

**Integration Example:**

```typescript
// src/modules/analysis/services/llm-analysis.service.ts
import { Anthropic } from '@anthropic-ai/sdk';

@Injectable()
export class LLMAnalysisService {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async analyzeIntent(intent: string): Promise<AnalysisResult> {
    const response = await this.anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Analyze this intent and determine complexity: "${intent}"
          
          Return JSON with:
          - complexity: "low" | "medium" | "high"
          - category: string
          - keywords: string[]
          - recommended_approach: "simple" | "workflow" | "agent"
          - confidence: number (0-100)
          `,
        },
      ],
    });

    return JSON.parse(response.content[0].text);
  }
}
```

**Pricing:**
- Claude 3 Sonnet: $3/1M input tokens, $15/1M output tokens
- Claude 3 Haiku: $0.25/1M input tokens, $1.25/1M output tokens

### Option 2: OpenAI GPT API

**API Key Required:** Yes

```bash
# Add to .env file
OPENAI_API_KEY=your_api_key_here
```

**Integration Example:**

```typescript
import OpenAI from 'openai';

@Injectable()
export class OpenAIAnalysisService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async analyzeIntent(intent: string): Promise<AnalysisResult> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an AI decision engine that analyzes user intents.',
        },
        {
          role: 'user',
          content: `Analyze this intent: "${intent}"`,
        },
      ],
      response_format: { type: 'json_object' },
    });

    return JSON.parse(response.choices[0].message.content);
  }
}
```

**Pricing:**
- GPT-4 Turbo: $10/1M input tokens, $30/1M output tokens
- GPT-3.5 Turbo: $0.50/1M input tokens, $1.50/1M output tokens

### Option 3: Local LLM (Ollama)

**API Key Required:** No (self-hosted)

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull a model
ollama pull mistral
```

**Integration Example:**

```typescript
@Injectable()
export class OllamaAnalysisService {
  private baseUrl = 'http://localhost:11434';

  async analyzeIntent(intent: string): Promise<AnalysisResult> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'mistral',
        prompt: `Analyze this intent: "${intent}"`,
        format: 'json',
      }),
    });

    return await response.json();
  }
}
```

**Pricing:** Free (runs locally, requires GPU for good performance)

## Recommendation

| Scenario | Recommended Solution |
|----------|---------------------|
| Development/MVP | Mock (current implementation) |
| Production (low volume) | OpenAI GPT-3.5 Turbo |
| Production (high quality) | Anthropic Claude 3 Sonnet |
| Privacy/On-premise | Ollama (local) |
| Cost-sensitive | Mock → Ollama → GPT-3.5 |

## Implementation Steps

1. **Add API key to `.env`**
2. **Install SDK** (npm install @anthropic-ai/sdk or openai)
3. **Create LLM service** in backend
4. **Update AnalysisService** to use LLM instead of mock
5. **Add error handling** for API failures
6. **Implement fallback** to mock if API fails
7. **Add rate limiting** to control costs

## Environment Variables

```env
# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:3001

# Backend (.env)
PORT=3001
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
# Or use Ollama (no key needed)
OLLAMA_BASE_URL=http://localhost:11434
```
