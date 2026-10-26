import { IsEnum, IsString, IsNumber, IsArray, IsBoolean, IsOptional } from 'class-validator';
import { ApproachType, QualityLevel } from '../entities/recommendation.entity';
import { ComplexityLevel } from '../../analysis/entities/analysis.entity';

export class CreateRecommendationDto {
  @IsEnum(ApproachType)
  approachType: ApproachType;

  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsString()
  estimatedTime: string;

  @IsNumber()
  tokenUsage: number;

  @IsEnum(QualityLevel)
  quality: QualityLevel;

  @IsNumber()
  confidence: number;

  @IsArray()
  @IsString({ each: true })
  pros: string[];

  @IsArray()
  @IsString({ each: true })
  cons: string[];

  @IsBoolean()
  isRecommended: boolean;

  @IsOptional()
  predictionMetrics?: {
    latencyMs: number;
    costEstimate: number;
    successProbability: number;
    qualityScore: number;
  };
}

export class RecommendationResponseDto {
  id: string;
  analysisId: string;
  approachType: ApproachType;
  name: string;
  description: string;
  estimatedTime: string;
  tokenUsage: number;
  quality: QualityLevel;
  confidence: number;
  pros: string[];
  cons: string[];
  isRecommended: boolean;
  predictionMetrics: {
    latencyMs: number;
    costEstimate: number;
    successProbability: number;
    qualityScore: number;
  };
}

export class DecisionResultDto {
  intent: string;
  complexity: ComplexityLevel;
  category: string;
  steps: string[];
  options: RecommendationResponseDto[];
  recommendedOption: ApproachType;
}
