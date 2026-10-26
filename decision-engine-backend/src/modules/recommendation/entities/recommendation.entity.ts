import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Analysis } from '../../analysis/entities/analysis.entity';

export enum ApproachType {
  SIMPLE = 'simple',
  WORKFLOW = 'workflow',
  AGENT = 'agent',
}

export enum QualityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  EXCELLENT = 'excellent',
}

@Entity('recommendations')
export class Recommendation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  analysisId: string;

  @ManyToOne(() => Analysis, (analysis) => analysis.recommendations)
  @JoinColumn({ name: 'analysisId' })
  analysis: Analysis;

  @Column({
    type: 'enum',
    enum: ApproachType,
  })
  approachType: ApproachType;

  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  estimatedTime: string;

  @Column('int')
  tokenUsage: number;

  @Column({
    type: 'enum',
    enum: QualityLevel,
  })
  quality: QualityLevel;

  @Column('int')
  confidence: number;

  @Column({ type: 'simple-array' })
  pros: string[];

  @Column({ type: 'simple-array' })
  cons: string[];

  @Column({ default: false })
  isRecommended: boolean;

  @Column({ type: 'simple-json', nullable: true })
  predictionMetrics: {
    latencyMs: number;
    costEstimate: number;
    successProbability: number;
    qualityScore: number;
  };

  @CreateDateColumn()
  createdAt: Date;
}
