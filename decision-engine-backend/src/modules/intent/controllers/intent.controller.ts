import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { IntentService } from '../services/intent.service';
import { CreateIntentDto } from '../dto/create-intent.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('intents')
export class IntentController {
  constructor(private readonly intentService: IntentService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateIntentDto, @Req() req) {
    const intent = await this.intentService.createIntent(dto, req.user.id);
    return {
      success: true,
      data: this.intentService.toResponseDto(intent),
    };
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const intent = await this.intentService.getIntent(id);
    return {
      success: true,
      data: this.intentService.toResponseDto(intent),
    };
  }

  @Get('session/:sessionId')
  async getBySession(@Param('sessionId') sessionId: string) {
    const intents = await this.intentService.getIntentsBySession(sessionId);
    return {
      success: true,
      data: intents.map((i) => this.intentService.toResponseDto(i)),
    };
  }
}
