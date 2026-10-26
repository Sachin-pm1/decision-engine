import { Module, forwardRef } from '@nestjs/common';
import { ExecutionService } from './services/execution.service';
import { ExecutionController } from './controllers/execution.controller';
import { ExecutionGateway } from './gateways/execution.gateway';
import { LlmModule } from '../llm/llm.module';
import { IntentModule } from '../intent/intent.module';
import { AnalysisModule } from '../analysis/analysis.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Execution } from './entities/execution.entity';
import { ExecutionRepository } from './repositories/execution.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Execution]),
    LlmModule,
    IntentModule,
    forwardRef(() => AnalysisModule),
  ],
  controllers: [ExecutionController],
  providers: [ExecutionService, ExecutionGateway, ExecutionRepository],
  exports: [ExecutionService, ExecutionGateway],
})
export class ExecutionModule {}
