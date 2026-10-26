import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Recommendation } from '../entities/recommendation.entity';

@Injectable()
export class RecommendationRepository {
  constructor(
    @InjectRepository(Recommendation)
    private readonly repository: Repository<Recommendation>,
  ) {}

  async create(data: Partial<Recommendation>): Promise<Recommendation> {
    const recommendation = this.repository.create(data);
    return await this.repository.save(recommendation);
  }

  async findById(id: string): Promise<Recommendation | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['analysis'],
    });
  }

  async findByAnalysisId(analysisId: string): Promise<Recommendation[]> {
    return await this.repository.find({
      where: { analysisId },
      order: { createdAt: 'ASC' },
    });
  }

  async findRecommended(analysisId: string): Promise<Recommendation | null> {
    return await this.repository.findOne({
      where: { analysisId, isRecommended: true },
    });
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
