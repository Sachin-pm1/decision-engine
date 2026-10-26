import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Analysis } from '../../analysis/entities/analysis.entity';
import { User } from '../../auth/entities/user.entity';

export enum IntentStatus {
  PENDING = 'pending',
  ANALYZING = 'analyzing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('intents')
export class Intent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  text: string;

  @Column({
    type: 'enum',
    enum: IntentStatus,
    default: IntentStatus.PENDING,
  })
  status: IntentStatus;

  @Column({ nullable: true })
  sessionId: string;

  @Column({ nullable: true })
  userId: string;

  @Column({ type: 'simple-json', nullable: true })
  metadata: {
    source: string;
    userAgent: string;
    ipAddress: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Analysis, (analysis) => analysis.intent, {
    cascade: true,
  })
  analyses: Analysis[];

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
