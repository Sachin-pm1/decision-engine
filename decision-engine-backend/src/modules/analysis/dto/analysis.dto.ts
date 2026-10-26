import { IsEnum, IsOptional, IsString, IsUUID, IsArray } from 'class-validator';
import { ComplexityLevel, AnalysisStep } from '../entities/analysis.entity';

export class CreateAnalysisDto {
  @IsUUID()
  intentId: string;
}

export class UpdateAnalysisProgressDto {
  @IsEnum(AnalysisStep)
  currentStep: AnalysisStep;

  @IsArray()
  @IsEnum(AnalysisStep, { each: true })
  completedSteps: AnalysisStep[];

  percentage: number;
}

export class AnalysisResponseDto {
  id: string;
  intentId: string;
  complexity: ComplexityLevel;
  category: string;
  keywords: string[];
  progress: {
    currentStep: AnalysisStep;
    completedSteps: AnalysisStep[];
    percentage: number;
  };
  steps: string[];
  confidenceScore: number;
  isComplete: boolean;
  createdAt: Date;
}

export class AnalysisProgressEventDto {
  analysisId: string;
  intentId: string;
  step: AnalysisStep;
  percentage: number;
  message: string;
  timestamp: Date;
}
