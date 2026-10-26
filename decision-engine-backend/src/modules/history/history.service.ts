import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Analysis } from '../analysis/entities/analysis.entity';
import { Intent } from '../intent/entities/intent.entity';
import { Recommendation } from '../recommendation/entities/recommendation.entity';
import { Execution } from '../execution/entities/execution.entity';

@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(Analysis)
    private analysisRepo: Repository<Analysis>,
    @InjectRepository(Intent)
    private intentRepo: Repository<Intent>,
    @InjectRepository(Recommendation)
    private recommendationRepo: Repository<Recommendation>,
    @InjectRepository(Execution)
    private executionRepo: Repository<Execution>,
  ) {}

  async getUserHistory(userId: string) {
    // Get intents for this user with their analyses
    const intents = await this.intentRepo.find({
      where: { userId },
      relations: ['analyses', 'analyses.recommendations'],
      order: { createdAt: 'DESC' },
    });

    const history = [];
    for (const intent of intents) {
      for (const analysis of intent.analyses || []) {
        const recommended = analysis.recommendations?.find(r => r.isRecommended);
        history.push({
          id: analysis.id,
          intent: intent.text,
          complexity: analysis.complexity,
          category: analysis.category,
          recommended: recommended?.approachType || 'simple',
          date: analysis.createdAt,
          status: intent.status,
          isComplete: analysis.isComplete,
        });
      }
    }

    return history;
  }

  async getHistoryItem(id: string, userId: string) {
    // Find analysis by id and verify ownership through intent
    const analysis = await this.analysisRepo.findOne({
      where: { id },
      relations: ['intent', 'recommendations'],
    });

    if (!analysis || analysis.intent?.userId !== userId) {
      throw new NotFoundException('History item not found');
    }

    const recommended = analysis.recommendations?.find(r => r.isRecommended);

    // Get executions for this analysis
    const executions = await this.executionRepo.find({
      where: { analysisId: analysis.id },
      order: { createdAt: 'DESC' },
    });

    return {
      id: analysis.id,
      intent: analysis.intent?.text || '',
      complexity: analysis.complexity,
      category: analysis.category,
      recommended: recommended?.approachType || 'simple',
      date: analysis.createdAt,
      status: analysis.intent?.status,
      isComplete: analysis.isComplete,
      options: analysis.recommendations?.map(rec => ({
        id: rec.id,
        analysisId: rec.analysisId,
        approachType: rec.approachType,
        name: rec.name,
        description: rec.description,
        estimatedTime: rec.estimatedTime,
        tokenUsage: rec.tokenUsage,
        quality: rec.quality,
        confidence: rec.confidence,
        pros: rec.pros,
        cons: rec.cons,
        isRecommended: rec.isRecommended,
        predictionMetrics: rec.predictionMetrics,
      })) || [],
      executions: executions.map(ex => ({
        id: ex.id,
        approach: ex.approach,
        status: ex.status,
        result: ex.result,
        metadata: ex.metadata,
        createdAt: ex.createdAt,
      })) || [],
    };
  }

  async saveAnalysis(userId: string, data: any) {
    // Analyses are automatically saved via the analysis module
    return { success: true, message: 'Analysis saved' };
  }

  async deleteHistoryItem(id: string, userId: string) {
    console.log('Deleting history item:', id, 'for user:', userId);
    
    // Find analysis and verify ownership through intent
    const analysis = await this.analysisRepo.findOne({
      where: { id },
      relations: ['intent'],
    });

    console.log('Found analysis:', analysis);

    if (!analysis || analysis.intent?.userId !== userId) {
      console.log('Analysis not found or user mismatch');
      throw new NotFoundException('History item not found');
    }

    // Delete recommendations first (foreign key constraint)
    await this.recommendationRepo.delete({ analysisId: id });
    console.log('Deleted recommendations for analysis:', id);

    // Then delete the analysis
    await this.analysisRepo.remove(analysis);
    console.log('Successfully deleted analysis:', id);
    return { success: true, message: 'History item deleted' };
  }
}
