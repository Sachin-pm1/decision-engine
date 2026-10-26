import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Analysis, AnalysisStep } from '../entities/analysis.entity';

@Injectable()
export class AnalysisRepository {
  constructor(
    @InjectRepository(Analysis)
    private readonly repository: Repository<Analysis>,
  ) {}

  async create(data: Partial<Analysis>): Promise<Analysis> {
    const analysis = this.repository.create(data);
    return await this.repository.save(analysis);
  }

  async findById(id: string): Promise<Analysis | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['intent', 'recommendations'],
    });
  }

  async findByIntentId(intentId: string): Promise<Analysis | null> {
    return await this.repository.findOne({
      where: { intentId },
      relations: ['intent', 'recommendations'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateProgress(
    id: string,
    progress: { currentStep: AnalysisStep; completedSteps: AnalysisStep[]; percentage: number },
  ): Promise<void> {
    await this.repository.update(id, { progress });
  }

  async completeAnalysis(id: string, data: Partial<Analysis>): Promise<void> {
    await this.repository.update(id, {
      ...data,
      isComplete: true,
    });
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
