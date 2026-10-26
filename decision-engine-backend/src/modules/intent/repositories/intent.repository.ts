import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Intent, IntentStatus } from '../entities/intent.entity';

@Injectable()
export class IntentRepository {
  constructor(
    @InjectRepository(Intent)
    private readonly repository: Repository<Intent>,
  ) {}

  async create(data: Partial<Intent>): Promise<Intent> {
    const intent = this.repository.create(data);
    return await this.repository.save(intent);
  }

  async findById(id: string): Promise<Intent | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['analyses', 'analyses.recommendations'],
    });
  }

  async findAll(options?: { userId?: string; sessionId?: string; limit?: number }): Promise<Intent[]> {
    const query = this.repository.createQueryBuilder('intent')
      .leftJoinAndSelect('intent.analyses', 'analysis')
      .orderBy('intent.createdAt', 'DESC');

    if (options?.userId) {
      query.andWhere('intent.userId = :userId', { userId: options.userId });
    }

    if (options?.sessionId) {
      query.andWhere('intent.sessionId = :sessionId', { sessionId: options.sessionId });
    }

    if (options?.limit) {
      query.limit(options.limit);
    }

    return await query.getMany();
  }

  async updateStatus(id: string, status: IntentStatus): Promise<void> {
    await this.repository.update(id, { status, updatedAt: new Date() });
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
