import { Injectable, NotFoundException } from '@nestjs/common';
import { IntentRepository } from '../repositories/intent.repository';
import { Intent, IntentStatus } from '../entities/intent.entity';
import { CreateIntentDto, IntentResponseDto } from '../dto/create-intent.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class IntentService {
  constructor(private readonly intentRepository: IntentRepository) {}

  async createIntent(dto: CreateIntentDto, userId?: string): Promise<Intent> {
    const intent = await this.intentRepository.create({
      id: uuidv4(),
      text: dto.text,
      status: IntentStatus.PENDING,
      sessionId: dto.sessionId || uuidv4(),
      userId: userId || dto.userId,
      metadata: dto.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return intent;
  }

  async getIntent(id: string): Promise<Intent> {
    const intent = await this.intentRepository.findById(id);
    if (!intent) {
      throw new NotFoundException(`Intent with ID ${id} not found`);
    }
    return intent;
  }

  async getIntentsBySession(sessionId: string): Promise<Intent[]> {
    return await this.intentRepository.findAll({ sessionId });
  }

  async updateStatus(id: string, status: IntentStatus): Promise<void> {
    await this.intentRepository.updateStatus(id, status);
  }

  toResponseDto(intent: Intent): IntentResponseDto {
    return {
      id: intent.id,
      text: intent.text,
      status: intent.status,
      createdAt: intent.createdAt,
      updatedAt: intent.updatedAt,
    };
  }
}
