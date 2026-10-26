import { Module, forwardRef } from '@nestjs/common';
import { AnalysisGateway } from './gateways/analysis.gateway';
import { AnalysisModule } from '../analysis/analysis.module';

@Module({
  imports: [forwardRef(() => AnalysisModule)],
  providers: [AnalysisGateway],
  exports: [AnalysisGateway],
})
export class RealtimeModule {}
