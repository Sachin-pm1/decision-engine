import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Intent } from './entities/intent.entity';
import { IntentService } from './services/intent.service';
import { IntentRepository } from './repositories/intent.repository';
import { IntentController } from './controllers/intent.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Intent])],
  controllers: [IntentController],
  providers: [IntentService, IntentRepository],
  exports: [IntentService, IntentRepository],
})
export class IntentModule {}
