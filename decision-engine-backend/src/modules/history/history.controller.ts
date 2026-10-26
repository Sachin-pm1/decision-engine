import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req, Header } from '@nestjs/common';
import { HistoryService } from './history.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('history')
@UseGuards(JwtAuthGuard)
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get()
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  async getUserHistory(@Req() req) {
    return this.historyService.getUserHistory(req.user.id);
  }

  @Get(':id')
  async getHistoryItem(@Param('id') id: string, @Req() req) {
    return this.historyService.getHistoryItem(id, req.user.id);
  }

  @Post()
  async saveAnalysis(@Body() data: any, @Req() req) {
    return this.historyService.saveAnalysis(req.user.id, data);
  }

  @Delete(':id')
  async deleteHistoryItem(@Param('id') id: string, @Req() req) {
    return this.historyService.deleteHistoryItem(id, req.user.id);
  }
}
