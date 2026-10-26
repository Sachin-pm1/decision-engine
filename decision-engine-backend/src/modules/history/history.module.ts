import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HistoryController } from './history.controller';
import { HistoryService } from './history.service';
import { Analysis } from '../analysis/entities/analysis.entity';
import { Intent } from '../intent/entities/intent.entity';
import { Recommendation } from '../recommendation/entities/recommendation.entity';
import { Execution } from '../execution/entities/execution.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Analysis, Intent, Recommendation, Execution])],
  controllers: [HistoryController],
  providers: [HistoryService],
})
export class HistoryModule {}
