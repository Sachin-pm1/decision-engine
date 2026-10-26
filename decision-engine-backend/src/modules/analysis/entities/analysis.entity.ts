import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Intent } from '../../intent/entities/intent.entity';
import { Recommendation } from '../../recommendation/entities/recommendation.entity';

export enum ComplexityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum AnalysisStep {
  INTENT_UNDERSTANDING = 'intent_understanding',
  COMPLEXITY_ANALYSIS = 'complexity_analysis',
  APPROACH_COMPARISON = 'approach_comparison',
  RECOMMENDATION_GENERATION = 'recommendation_generation',
}

@Entity('analyses')
export class Analysis {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  intentId: string;

  @ManyToOne(() => Intent, (intent) => intent.analyses)
  @JoinColumn({ name: 'intentId' })
  intent: Intent;

  @Column({
    type: 'enum',
    enum: ComplexityLevel,
    nullable: true,
  })
  complexity: ComplexityLevel;

  @Column({ nullable: true })
  category: string;

  @Column({ type: 'simple-array', nullable: true })
  keywords: string[];

  @Column({ type: 'simple-json', nullable: true })
  extractedEntities: Record<string, any>;

  @Column({ type: 'simple-json', nullable: true })
  progress: {
    currentStep: AnalysisStep;
    completedSteps: AnalysisStep[];
    percentage: number;
  };

  @Column({ type: 'simple-json', nullable: true })
  steps: string[];

  @Column({ type: 'float', nullable: true })
  confidenceScore: number;

  @Column({ default: false })
  isComplete: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Recommendation, (rec) => rec.analysis, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  recommendations: Recommendation[];
}
