import { Injectable, NotFoundException, forwardRef, Inject } from '@nestjs/common';
import { AnalysisRepository } from '../repositories/analysis.repository';
import { Analysis, AnalysisStep, ComplexityLevel } from '../entities/analysis.entity';
import { IntentService } from '../../intent/services/intent.service';
import { IntentStatus } from '../../intent/entities/intent.entity';
import { AnalysisGateway } from '../../realtime/gateways/analysis.gateway';
import { RecommendationService } from '../../recommendation/services/recommendation.service';
import { LlmService } from '../../llm/llm.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AnalysisService {
  constructor(
    private readonly analysisRepository: AnalysisRepository,
    private readonly intentService: IntentService,
    @Inject(forwardRef(() => AnalysisGateway))
    private readonly analysisGateway: AnalysisGateway,
    @Inject(forwardRef(() => RecommendationService))
    private readonly recommendationService: RecommendationService,
    private readonly llmService: LlmService,
  ) {}

  async startAnalysis(intentId: string): Promise<Analysis> {
    const intent = await this.intentService.getIntent(intentId);
    
    // Create analysis record
    const analysis = await this.analysisRepository.create({
      id: uuidv4(),
      intentId,
      progress: {
        currentStep: AnalysisStep.INTENT_UNDERSTANDING,
        completedSteps: [],
        percentage: 0,
      },
      isComplete: false,
      createdAt: new Date(),
    });

    // Update intent status
    await this.intentService.updateStatus(intentId, IntentStatus.ANALYZING);

    // Start async analysis process
    this.performAnalysis(analysis.id, intent.text, intentId).catch(console.error);

    return analysis;
  }

  private async performAnalysis(analysisId: string, intentText: string, intentId: string): Promise<void> {
    try {
      console.log(`📊 Starting analysis ${analysisId} for intent: "${intentText.substring(0, 60)}..."`);

      // Step 1: Understanding Intent via Claude (0-25%)
      await this.broadcastProgress(analysisId, AnalysisStep.INTENT_UNDERSTANDING, 25, 'Claude is analyzing your goal...');
      const llmResult = await this.llmService.analyzeIntent(intentText);

      const keywords = llmResult.keywords;
      const complexity = llmResult.complexity as ComplexityLevel;
      const category = llmResult.category;

      // Step 2: Analyzing Complexity (25-50%)
      await this.broadcastProgress(analysisId, AnalysisStep.COMPLEXITY_ANALYSIS, 50, 'Evaluating task structure...');
      const steps = llmResult.steps;

      // Step 3: Comparing Approaches via Claude (50-75%)
      await this.broadcastProgress(analysisId, AnalysisStep.APPROACH_COMPARISON, 75, 'Claude is comparing approaches...');
      const llmRecommendations = await this.llmService.generateRecommendations(
        intentText,
        complexity,
        category,
      );

      // Save recommendations to DB
      const recommendations = await this.recommendationService.createRecommendationsFromLlm(
        analysisId,
        llmRecommendations,
      );

      const recommendedOption = recommendations.find((r) => r.isRecommended)?.approachType || 'simple';

      // Step 4: Generating Recommendation (75-100%)
      await this.broadcastProgress(analysisId, AnalysisStep.RECOMMENDATION_GENERATION, 100, 'Finalizing best approach...');

      // Complete analysis
      await this.analysisRepository.completeAnalysis(analysisId, {
        complexity,
        category,
        keywords,
        extractedEntities: { summary: llmResult.summary },
        steps,
        confidenceScore: llmResult.confidenceScore,
      });

      // Update intent status to completed
      await this.intentService.updateStatus(intentId, IntentStatus.COMPLETED);

      console.log(`✅ Analysis ${analysisId} completed successfully`);

      // Broadcast completion
      this.analysisGateway.broadcastAnalysisComplete(analysisId, {
        recommendations,
        recommendedOption,
        complexity,
        category,
        steps,
      });

    } catch (error) {
      console.error(`❌ Analysis ${analysisId} failed:`, error?.message || error);
      this.analysisGateway.broadcastAnalysisError(analysisId, error?.message || 'Analysis failed');
    }
  }

  private async broadcastProgress(
    analysisId: string,
    step: AnalysisStep,
    percentage: number,
    message: string,
  ): Promise<void> {
    const completedSteps = this.getCompletedSteps(step);
    
    await this.analysisRepository.updateProgress(analysisId, {
      currentStep: step,
      completedSteps,
      percentage,
    });

    this.analysisGateway.broadcastProgress(analysisId, {
      step,
      percentage,
      message,
      timestamp: new Date(),
    });
  }

  private getCompletedSteps(currentStep: AnalysisStep): AnalysisStep[] {
    const allSteps = [
      AnalysisStep.INTENT_UNDERSTANDING,
      AnalysisStep.COMPLEXITY_ANALYSIS,
      AnalysisStep.APPROACH_COMPARISON,
      AnalysisStep.RECOMMENDATION_GENERATION,
    ];
    const currentIndex = allSteps.indexOf(currentStep);
    return allSteps.slice(0, currentIndex);
  }

  async getAnalysis(id: string): Promise<Analysis> {
    const analysis = await this.analysisRepository.findById(id);
    if (!analysis) {
      throw new NotFoundException(`Analysis with ID ${id} not found`);
    }
    return analysis;
  }

  async getAnalysisByIntent(intentId: string): Promise<Analysis | null> {
    return await this.analysisRepository.findByIntentId(intentId);
  }
}
