import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Recommendation } from './entities/recommendation.entity';
import { RecommendationService } from './services/recommendation.service';
import { RecommendationRepository } from './repositories/recommendation.repository';
import { RecommendationController } from './controllers/recommendation.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Recommendation]),
  ],
  controllers: [RecommendationController],
  providers: [RecommendationService, RecommendationRepository],
  exports: [RecommendationService, RecommendationRepository],
})
export class RecommendationModule {}
