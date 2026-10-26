import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Analysis } from '../../analysis/entities/analysis.entity';

export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum ExecutionApproach {
  SIMPLE = 'simple',
  WORKFLOW = 'workflow',
  AGENT = 'agent',
}

@Entity('executions')
export class Execution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  analysisId: string;

  @Column({
    type: 'enum',
    enum: ExecutionApproach,
  })
  approach: ExecutionApproach;

  @Column({ type: 'text' })
  intentText: string;

  @Column({
    type: 'enum',
    enum: ExecutionStatus,
    default: ExecutionStatus.PENDING,
  })
  status: ExecutionStatus;

  @Column({ type: 'text', nullable: true })
  result?: string;

  @Column({ type: 'simple-json', nullable: true })
  steps?: {
    step: number;
    description: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    output?: string;
  }[];

  @Column({ type: 'simple-json', nullable: true })
  metadata?: {
    tokenUsage: number;
    executionTime: number;
    modelUsed: string;
  };

  @Column({ type: 'text', nullable: true })
  error?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Analysis, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'analysisId' })
  analysis: Analysis;
}
