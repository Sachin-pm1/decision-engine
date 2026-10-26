import { Controller, Get, Param } from '@nestjs/common';
import { RecommendationService } from '../services/recommendation.service';

@Controller('recommendations')
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  @Get('analysis/:analysisId')
  async getByAnalysis(@Param('analysisId') analysisId: string) {
    const recommendations = await this.recommendationService.getRecommendationsByAnalysis(analysisId);
    return {
      success: true,
      data: recommendations,
    };
  }
}
