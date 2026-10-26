import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Analysis } from './entities/analysis.entity';
import { AnalysisService } from './services/analysis.service';
import { AnalysisRepository } from './repositories/analysis.repository';
import { AnalysisController } from './controllers/analysis.controller';
import { IntentModule } from '../intent/intent.module';
import { RecommendationModule } from '../recommendation/recommendation.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Analysis]),
    IntentModule,
    forwardRef(() => RecommendationModule),
    forwardRef(() => RealtimeModule),
  ],
  controllers: [AnalysisController],
  providers: [AnalysisService, AnalysisRepository],
  exports: [AnalysisService, AnalysisRepository],
})
export class AnalysisModule {}
