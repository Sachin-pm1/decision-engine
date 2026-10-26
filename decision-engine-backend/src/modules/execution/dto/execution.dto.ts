import { IsEnum, IsString, IsOptional, IsUUID } from 'class-validator';
import { ExecutionApproach, ExecutionStatus } from '../entities/execution.entity';

export class CreateExecutionDto {
  @IsUUID()
  analysisId: string;

  @IsEnum(ExecutionApproach)
  approach: ExecutionApproach;

  @IsString()
  intentText: string;

  @IsOptional()
  @IsString()
  customPrompt?: string;
}

export class ExecutionResponseDto {
  id: string;
  analysisId: string;
  approach: ExecutionApproach;
  intentText: string;
  status: ExecutionStatus;
  result?: string;
  steps?: {
    step: number;
    description: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    output?: string;
  }[];
  metadata?: {
    tokenUsage: number;
    executionTime: number;
    modelUsed: string;
  };
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ExecutionProgressDto {
  executionId: string;
  step: number;
  totalSteps: number;
  status: ExecutionStatus;
  currentStepDescription?: string;
  output?: string;
  percentage: number;
}
