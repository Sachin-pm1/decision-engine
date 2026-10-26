import { Injectable, OnModuleInit, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenAI } from '@google/genai';

export interface AnalysisResult {
  complexity: 'low' | 'medium' | 'high';
  category: string;
  keywords: string[];
  steps: string[];
  confidenceScore: number;
  summary: string;
}

export interface RecommendationResult {
  approachType: 'simple' | 'workflow' | 'agent';
  name: string;
  description: string;
  estimatedTime: string;
  tokenUsage: number;
  quality: 'low' | 'medium' | 'high' | 'excellent';
  confidence: number;
  pros: string[];
  cons: string[];
  isRecommended: boolean;
}

type LLMProvider = 'claude' | 'gemini';

@Injectable()
export class LlmService implements OnModuleInit {
  private readonly logger = new Logger(LlmService.name);
  private claudeClient: Anthropic | null = null;
  private geminiClient: GoogleGenAI | null = null;
  private claudeModel: string;
  private geminiModel: string;
  private primaryProvider: LLMProvider = 'claude';

  constructor(private configService: ConfigService) {
    this.claudeModel = this.configService.get<string>('CLAUDE_MODEL') || 'claude-3-5-sonnet-20241022';
    // Use valid Gemini model names according to Google Generative AI API
    // Available stable models: gemini-1.5-pro, gemini-1.5-flash, gemini-1.0-pro, gemini-pro
    // NOTE: Model names must be lowercase with hyphens, no spaces
    this.geminiModel = this.configService.get<string>('GEMINI_MODEL') || 'gemini-1.5-flash';
  }

  onModuleInit() {
    // Try to configure Claude
    const anthropicKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (anthropicKey && anthropicKey !== 'sk-ant-your-key-here' && anthropicKey.startsWith('sk-ant-')) {
      this.claudeClient = new Anthropic({ apiKey: anthropicKey, timeout: 60000 });
      this.logger.log(`✅ Claude API configured successfully (model: ${this.claudeModel})`);
    } else {
      this.logger.warn('⚠️ Claude API key not configured or invalid');
    }

    // Try to configure Gemini as fallback
    const geminiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (geminiKey && geminiKey !== 'your-gemini-key-here') {
      // Validate Gemini model name format - must be lowercase with hyphens
      const validGeminiModels = ['gemini-2.5-flash', 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro'];
      if (!validGeminiModels.includes(this.geminiModel)) {
        this.logger.warn(`⚠️ Invalid Gemini model name: "${this.geminiModel}". Valid options: ${validGeminiModels.join(', ')}`);
        this.logger.warn(`🔄 Falling back to gemini-2.5-flash`);
        this.geminiModel = 'gemini-2.5-flash';
      }
      this.geminiClient = new GoogleGenAI({ apiKey: geminiKey });
      this.logger.log(`✅ Gemini API configured successfully (model: ${this.geminiModel})`);
    } else {
      this.logger.warn('⚠️ Gemini API key not configured');
    }

    // Determine primary provider
    if (!this.claudeClient && !this.geminiClient) {
      this.logger.warn('⚠️ No LLM provider configured. Analysis and recommendation features will be disabled.');
      return;
    }

    if (!this.claudeClient) {
      this.primaryProvider = 'gemini';
      this.logger.log('🔄 Using Gemini as primary provider (Claude not configured)');
    }
  }

  async analyzeIntent(intentText: string): Promise<AnalysisResult> {
    // Try Claude first if available
    if (this.claudeClient) {
      try {
        return await this.analyzeIntentWithClaude(intentText);
      } catch (error) {
        this.logger.warn(`Claude analysis failed, falling back to Gemini: ${error.message}`);
        if (!this.geminiClient) {
          throw error;
        }
      }
    }

    // Fallback to Gemini
    if (this.geminiClient) {
      return await this.analyzeIntentWithGemini(intentText);
    }

    throw new InternalServerErrorException('No LLM provider available');
  }

  private async analyzeIntentWithClaude(intentText: string): Promise<AnalysisResult> {
    this.logger.log(`🔍 Claude: Analyzing intent: "${intentText.substring(0, 80)}..."`);
    const response = await this.claudeClient!.messages.create({
      model: this.claudeModel,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Analyze the following user intent/task and return a JSON object with these fields:
- complexity: "low", "medium", or "high" (based on task difficulty, steps required, and technical depth)
- category: a descriptive category name (e.g., "Content Generation", "Data Analysis", "System Design", "Process Automation", "Code Development", etc.)
- keywords: array of 3-7 relevant keywords extracted from the intent
- steps: array of 3-7 logical steps needed to accomplish this task
- confidenceScore: a number 70-98 representing how confident you are in this analysis
- summary: a one-sentence summary of what the user wants to accomplish

User intent: "${intentText}"

Respond ONLY with valid JSON, no other text.`,
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new InternalServerErrorException('No text in Claude response');
    }

    const jsonStr = textBlock.text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    const parsed = JSON.parse(jsonStr);

    const result = {
      complexity: this.normalizeComplexity(parsed.complexity),
      category: parsed.category || 'General',
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      steps: Array.isArray(parsed.steps) ? parsed.steps : [],
      confidenceScore: typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : 80,
      summary: parsed.summary || '',
    };
    this.logger.log(`✅ Claude: Analysis complete - complexity: ${result.complexity}, category: ${result.category}`);
    return result;
  }

  private async analyzeIntentWithGemini(intentText: string): Promise<AnalysisResult> {
    this.logger.log(`🔍 Gemini: Analyzing intent: "${intentText.substring(0, 80)}..."`);

    const prompt = `Analyze the following user intent/task and return a JSON object with these fields:
- complexity: "low", "medium", or "high" (based on task difficulty, steps required, and technical depth)
- category: a descriptive category name (e.g., "Content Generation", "Data Analysis", "System Design", "Process Automation", "Code Development", etc.)
- keywords: array of 3-7 relevant keywords extracted from the intent
- steps: array of 3-7 logical steps needed to accomplish this task
- confidenceScore: a number 70-98 representing how confident you are in this analysis
- summary: a one-sentence summary of what the user wants to accomplish

User intent: "${intentText}"

Respond ONLY with valid JSON, no other text.`;

    const result = await this.geminiClient!.models.generateContent({
      model: this.geminiModel,
      contents: prompt,
    });

    const text = result.text;
    if (!text) {
      throw new InternalServerErrorException('No response text from Gemini');
    }

    const jsonStr = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    const parsed = JSON.parse(jsonStr);

    const analysisResult = {
      complexity: this.normalizeComplexity(parsed.complexity),
      category: parsed.category || 'General',
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      steps: Array.isArray(parsed.steps) ? parsed.steps : [],
      confidenceScore: typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : 80,
      summary: parsed.summary || '',
    };
    this.logger.log(`✅ Gemini: Analysis complete - complexity: ${analysisResult.complexity}, category: ${analysisResult.category}`);
    return analysisResult;
  }

  async generateRecommendations(
    intentText: string,
    complexity: string,
    category: string,
  ): Promise<RecommendationResult[]> {
    // Try Claude first if available
    if (this.claudeClient) {
      try {
        return await this.generateRecommendationsWithClaude(intentText, complexity, category);
      } catch (error) {
        this.logger.warn(`Claude recommendations failed, falling back to Gemini: ${error.message}`);
        if (!this.geminiClient) {
          throw error;
        }
      }
    }

    // Fallback to Gemini
    if (this.geminiClient) {
      return await this.generateRecommendationsWithGemini(intentText, complexity, category);
    }

    throw new InternalServerErrorException('No LLM provider available');
  }

  private async generateRecommendationsWithClaude(
    intentText: string,
    complexity: string,
    category: string,
  ): Promise<RecommendationResult[]> {
    this.logger.log(`🔍 Claude: Generating recommendations for complexity: ${complexity}, category: ${category}`);
    const response = await this.claudeClient!.messages.create({
      model: this.claudeModel,
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `Given this user intent and analysis, generate 3 AI approach recommendations. Return a JSON array with 3 objects, each having:
- approachType: "simple", "workflow", or "agent"
- name: a short descriptive name for this approach
- description: 1-2 sentences explaining how this approach would handle the task
- estimatedTime: string like "5-15 seconds", "30-60 seconds", "2-5 minutes"
- tokenUsage: estimated token count (number)
- quality: "low", "medium", "high", or "excellent"
- confidence: number 0-100 representing how well this approach fits
- pros: array of 3-4 advantages
- cons: array of 2-3 disadvantages
- isRecommended: boolean - true for the ONE best approach for this specific task

User intent: "${intentText}"
Complexity: ${complexity}
Category: ${category}

Rules:
- For low complexity tasks, recommend "simple" approach
- For medium complexity, recommend "workflow" approach
- For high complexity, recommend "agent" approach
- Token usage should scale with complexity: simple (500-2000), workflow (2000-8000), agent (5000-20000)
- Only ONE approach should have isRecommended: true

Respond ONLY with valid JSON array, no other text.`,
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new InternalServerErrorException('No text in Claude response');
    }

    const jsonStr = textBlock.text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    const parsed = JSON.parse(jsonStr);

    if (!Array.isArray(parsed) || parsed.length !== 3) {
      throw new InternalServerErrorException('Claude returned invalid recommendation format');
    }

    const results = parsed.map((rec) => ({
      approachType: this.normalizeApproachType(rec.approachType),
      name: rec.name || 'Approach',
      description: rec.description || '',
      estimatedTime: rec.estimatedTime || '30-60 seconds',
      tokenUsage: typeof rec.tokenUsage === 'number' ? rec.tokenUsage : 2000,
      quality: this.normalizeQuality(rec.quality),
      confidence: typeof rec.confidence === 'number' ? rec.confidence : 70,
      pros: Array.isArray(rec.pros) ? rec.pros : [],
      cons: Array.isArray(rec.cons) ? rec.cons : [],
      isRecommended: !!rec.isRecommended,
    }));
    this.logger.log(`✅ Claude: Generated ${results.length} recommendations, recommended: ${results.find(r => r.isRecommended)?.approachType}`);
    return results;
  }

  private async generateRecommendationsWithGemini(
    intentText: string,
    complexity: string,
    category: string,
  ): Promise<RecommendationResult[]> {
    this.logger.log(`🔍 Gemini: Generating recommendations for complexity: ${complexity}, category: ${category}`);

    const prompt = `Given this user intent and analysis, generate 3 AI approach recommendations. Return a JSON array with 3 objects, each having:
- approachType: "simple", "workflow", or "agent"
- name: a short descriptive name for this approach
- description: 1-2 sentences explaining how this approach would handle the task
- estimatedTime: string like "5-15 seconds", "30-60 seconds", "2-5 minutes"
- tokenUsage: estimated token count (number)
- quality: "low", "medium", "high", or "excellent"
- confidence: number 0-100 representing how well this approach fits
- pros: array of 3-4 advantages
- cons: array of 2-3 disadvantages
- isRecommended: boolean - true for the ONE best approach for this specific task

User intent: "${intentText}"
Complexity: ${complexity}
Category: ${category}

Rules:
- For low complexity tasks, recommend "simple" approach
- For medium complexity, recommend "workflow" approach
- For high complexity, recommend "agent" approach
- Token usage should scale with complexity: simple (500-2000), workflow (2000-8000), agent (5000-20000)
- Only ONE approach should have isRecommended: true

Respond ONLY with valid JSON array, no other text.`;

    const result = await this.geminiClient!.models.generateContent({
      model: this.geminiModel,
      contents: prompt,
    });

    const text = result.text;
    if (!text) {
      throw new InternalServerErrorException('No response text from Gemini');
    }

    const jsonStr = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    const parsed = JSON.parse(jsonStr);

    if (!Array.isArray(parsed) || parsed.length !== 3) {
      throw new InternalServerErrorException('Gemini returned invalid recommendation format');
    }

    const results = parsed.map((rec) => ({
      approachType: this.normalizeApproachType(rec.approachType),
      name: rec.name || 'Approach',
      description: rec.description || '',
      estimatedTime: rec.estimatedTime || '30-60 seconds',
      tokenUsage: typeof rec.tokenUsage === 'number' ? rec.tokenUsage : 2000,
      quality: this.normalizeQuality(rec.quality),
      confidence: typeof rec.confidence === 'number' ? rec.confidence : 70,
      pros: Array.isArray(rec.pros) ? rec.pros : [],
      cons: Array.isArray(rec.cons) ? rec.cons : [],
      isRecommended: !!rec.isRecommended,
    }));
    this.logger.log(`✅ Gemini: Generated ${results.length} recommendations, recommended: ${results.find(r => r.isRecommended)?.approachType}`);
    return results;
  }

  async executeSimplePrompt(prompt: string): Promise<{ content: string; tokenUsage: number }> {
    // Try Claude first if available
    if (this.claudeClient) {
      try {
        return await this.executeWithClaude(prompt);
      } catch (error) {
        this.logger.warn(`Claude execution failed, falling back to Gemini: ${error.message}`);
        if (!this.geminiClient) {
          throw error;
        }
      }
    }

    // Fallback to Gemini
    if (this.geminiClient) {
      return await this.executeWithGemini(prompt);
    }

    throw new InternalServerErrorException('No LLM provider available');
  }

  private async executeWithClaude(prompt: string): Promise<{ content: string; tokenUsage: number }> {
    this.logger.log(`🚀 Claude: Executing prompt`);
    
    try {
      const response = await this.claudeClient!.messages.create({
        model: this.claudeModel,
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const textBlock = response.content.find((block) => block.type === 'text');
      if (!textBlock || textBlock.type !== 'text') {
        throw new InternalServerErrorException('No text in Claude response');
      }

      const tokenUsage = response.usage?.output_tokens + response.usage?.input_tokens || 0;

      this.logger.log(`✅ Claude: Execution complete`);
      return {
        content: textBlock.text,
        tokenUsage,
      };
    } catch (error: any) {
      const errorMessage = error?.message || String(error);
      
      // Check for rate limit errors
      if (errorMessage.includes('429') || 
          errorMessage.includes('rate_limit') ||
          errorMessage.includes('rate limit')) {
        this.logger.error('❌ Claude API rate limit exceeded');
        throw new InternalServerErrorException('AI service rate limit exceeded. Please try again later.');
      }
      
      // Check for credit/billing errors
      if (errorMessage.includes('credit') || 
          errorMessage.includes('billing') ||
          errorMessage.includes('insufficient_quota')) {
        this.logger.error('❌ Claude API credits exhausted');
        throw new InternalServerErrorException('AI service credits exhausted. Please check your billing.');
      }
      
      // Check for authentication errors
      if (errorMessage.includes('401') || 
          errorMessage.includes('authentication') || 
          errorMessage.includes('API key')) {
        this.logger.error('❌ Claude API authentication failed');
        throw new InternalServerErrorException('AI service authentication failed. Please check your API key configuration.');
      }
      
      // Re-throw original error for other cases
      throw error;
    }
  }

  private async executeWithGemini(prompt: string): Promise<{ content: string; tokenUsage: number }> {
    this.logger.log(`🚀 Gemini: Executing prompt`);

    try {
      const result = await this.geminiClient!.models.generateContent({
        model: this.geminiModel,
        contents: prompt,
      });

      const text = result.text;
      if (!text) {
        throw new InternalServerErrorException('No response text from Gemini');
      }

      // Estimate token usage (Gemini doesn't provide exact token counts)
      const estimatedTokens = Math.ceil((prompt.length + text.length) / 4);

      this.logger.log(`✅ Gemini: Execution complete`);
      return {
        content: text,
        tokenUsage: estimatedTokens,
      };
    } catch (error: any) {
      const errorMessage = error?.message || String(error);
      
      // Check for quota/rate limit errors
      if (errorMessage.includes('429') || 
          errorMessage.includes('quota') || 
          errorMessage.includes('RESOURCE_EXHAUSTED') ||
          errorMessage.includes('rate limit')) {
        this.logger.error('❌ Gemini API quota exceeded');
        throw new InternalServerErrorException('AI service quota exceeded. No API credits available. Please check your billing or try again later.');
      }
      
      // Check for authentication errors
      if (errorMessage.includes('401') || 
          errorMessage.includes('authentication') || 
          errorMessage.includes('API key')) {
        this.logger.error('❌ Gemini API authentication failed');
        throw new InternalServerErrorException('AI service authentication failed. Please check your API key configuration.');
      }
      
      // Re-throw original error for other cases
      throw error;
    }
  }

  private normalizeComplexity(val: string): 'low' | 'medium' | 'high' {
    const lower = (val || '').toLowerCase();
    if (lower.includes('high')) return 'high';
    if (lower.includes('medium') || lower.includes('moderate')) return 'medium';
    return 'low';
  }

  private normalizeApproachType(val: string): 'simple' | 'workflow' | 'agent' {
    const lower = (val || '').toLowerCase();
    if (lower.includes('agent')) return 'agent';
    if (lower.includes('workflow') || lower.includes('chain') || lower.includes('multi')) return 'workflow';
    return 'simple';
  }

  private normalizeQuality(val: string): 'low' | 'medium' | 'high' | 'excellent' {
    const lower = (val || '').toLowerCase();
    if (lower.includes('excel') || lower.includes('outstanding')) return 'excellent';
    if (lower.includes('high') || lower.includes('great')) return 'high';
    if (lower.includes('medium') || lower.includes('moderate') || lower.includes('good')) return 'medium';
    return 'low';
  }
}
