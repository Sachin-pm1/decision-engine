import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { AnalysisService } from '../services/analysis.service';
import { CreateAnalysisDto } from '../dto/analysis.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('analysis')
@UseGuards(JwtAuthGuard)
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Post('start')
  @HttpCode(HttpStatus.ACCEPTED)
  async startAnalysis(@Body() dto: CreateAnalysisDto) {
    const analysis = await this.analysisService.startAnalysis(dto.intentId);
    return {
      success: true,
      message: 'Analysis started',
      data: {
        analysisId: analysis.id,
        intentId: analysis.intentId,
        status: 'analyzing',
      },
    };
  }

  @Get(':id')
  async getAnalysis(@Param('id') id: string) {
    const analysis = await this.analysisService.getAnalysis(id);
    return {
      success: true,
      data: analysis,
    };
  }

  @Get('intent/:intentId')
  async getAnalysisByIntent(@Param('intentId') intentId: string) {
    const analysis = await this.analysisService.getAnalysisByIntent(intentId);
    return {
      success: true,
      data: analysis,
    };
  }
}
