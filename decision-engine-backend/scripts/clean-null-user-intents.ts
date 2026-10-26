import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Intent } from '../src/modules/intent/entities/intent.entity';
import { Repository } from 'typeorm';

async function cleanNullUserIntents() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const intentRepo = app.get<Repository<Intent>>(getRepositoryToken(Intent));
  
  const result = await intentRepo.delete({ userId: null as any });
  console.log(`Deleted ${result.affected} intents with NULL userId`);
  
  await app.close();
  process.exit(0);
}

cleanNullUserIntents().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
