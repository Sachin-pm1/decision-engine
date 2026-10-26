import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Execution, ExecutionStatus } from '../entities/execution.entity';

@Injectable()
export class ExecutionRepository {
  constructor(
    @InjectRepository(Execution)
    private readonly repository: Repository<Execution>,
  ) {}

  async create(data: Partial<Execution>): Promise<Execution> {
    const execution = this.repository.create(data);
    return await this.repository.save(execution);
  }

  async findById(id: string): Promise<Execution | null> {
    return await this.repository.findOne({ where: { id } });
  }

  async findByAnalysisId(analysisId: string): Promise<Execution[]> {
    return await this.repository.find({ where: { analysisId }, order: { createdAt: 'DESC' } });
  }

  async updateStatus(id: string, status: ExecutionStatus, result?: string, error?: string): Promise<void> {
    const updateData: Partial<Execution> = { status };
    if (result !== undefined) updateData.result = result;
    if (error !== undefined) updateData.error = error;
    
    await this.repository.update(id, updateData);
  }

  async updateSteps(id: string, steps: Execution['steps']): Promise<void> {
    await this.repository.update(id, { steps });
  }

  async updateMetadata(id: string, metadata: Execution['metadata']): Promise<void> {
    await this.repository.update(id, { metadata });
  }
}
