import { IsString, IsNotEmpty, IsOptional, IsObject, IsUUID } from 'class-validator';

export class CreateIntentDto {
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsOptional()
  @IsUUID()
  sessionId?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsObject()
  metadata?: {
    source: string;
    userAgent: string;
    ipAddress: string;
  };
}

export class IntentResponseDto {
  id: string;
  text: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
