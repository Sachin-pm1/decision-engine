import { Injectable } from '@nestjs/common';
import { RecommendationRepository } from '../repositories/recommendation.repository';
import { Recommendation, ApproachType, QualityLevel } from '../entities/recommendation.entity';
import { RecommendationResult } from '../../llm/llm.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RecommendationService {
  constructor(private readonly recommendationRepository: RecommendationRepository) {}

  async createRecommendationsFromLlm(
    analysisId: string,
    llmRecommendations: RecommendationResult[],
  ): Promise<Recommendation[]> {
    const savedRecommendations: Recommendation[] = [];
    for (const rec of llmRecommendations) {
      const saved = await this.recommendationRepository.create({
        id: uuidv4(),
        analysisId,
        approachType: rec.approachType as ApproachType,
        name: rec.name,
        description: rec.description,
        estimatedTime: rec.estimatedTime,
        tokenUsage: rec.tokenUsage,
        quality: rec.quality as QualityLevel,
        confidence: rec.confidence,
        pros: rec.pros,
        cons: rec.cons,
        isRecommended: rec.isRecommended,
        predictionMetrics: {
          latencyMs: 0,
          costEstimate: rec.tokenUsage * 0.000003,
          successProbability: rec.confidence / 100,
          qualityScore: rec.confidence,
        },
      });
      savedRecommendations.push(saved);
    }
    return savedRecommendations;
  }

  async getRecommendationsByAnalysis(analysisId: string): Promise<Recommendation[]> {
    return await this.recommendationRepository.findByAnalysisId(analysisId);
  }
}
