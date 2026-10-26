import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ExecutionService } from '../services/execution.service';
import { CreateExecutionDto, ExecutionResponseDto } from '../dto/execution.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@Controller('executions')
@UseGuards(JwtAuthGuard)
export class ExecutionController {
  constructor(private readonly executionService: ExecutionService) {}

  @Post()
  async createExecution(
    @Body() dto: CreateExecutionDto,
    @CurrentUser() user: any,
  ): Promise<ExecutionResponseDto> {
    const execution = await this.executionService.createExecution(dto);
    return this.toResponseDto(execution);
  }

  @Get(':id')
  async getExecution(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ): Promise<ExecutionResponseDto> {
    const execution = await this.executionService.getExecution(id);
    return this.toResponseDto(execution);
  }

  @Get('analysis/:analysisId')
  async getExecutionsByAnalysis(
    @Param('analysisId') analysisId: string,
    @CurrentUser() user: any,
  ): Promise<ExecutionResponseDto[]> {
    const executions = await this.executionService.getExecutionsByAnalysis(analysisId);
    return executions.map(e => this.toResponseDto(e));
  }

  private toResponseDto(execution: any): ExecutionResponseDto {
    return {
      id: execution.id,
      analysisId: execution.analysisId,
      approach: execution.approach,
      intentText: execution.intentText,
      status: execution.status,
      result: execution.result,
      steps: execution.steps,
      metadata: execution.metadata,
      error: execution.error,
      createdAt: execution.createdAt,
      updatedAt: execution.updatedAt,
    };
  }
}
