import { Injectable, NotFoundException } from '@nestjs/common';
import { ExecutionRepository } from '../repositories/execution.repository';
import { Execution, ExecutionStatus, ExecutionApproach } from '../entities/execution.entity';
import { LlmService } from '../../llm/llm.service';
import { ExecutionGateway } from '../gateways/execution.gateway';
import { CreateExecutionDto } from '../dto/execution.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ExecutionService {
  constructor(
    private readonly executionRepository: ExecutionRepository,
    private readonly llmService: LlmService,
    private readonly executionGateway: ExecutionGateway,
  ) {}

  async createExecution(dto: CreateExecutionDto): Promise<Execution> {
    const execution = await this.executionRepository.create({
      id: uuidv4(),
      analysisId: dto.analysisId,
      approach: dto.approach,
      intentText: dto.intentText,
      status: ExecutionStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Start execution asynchronously
    this.runExecution(execution.id, dto).catch(console.error);

    return execution;
  }

  private async runExecution(executionId: string, dto: CreateExecutionDto): Promise<void> {
    const startTime = Date.now();
    
    try {
      await this.executionRepository.updateStatus(executionId, ExecutionStatus.RUNNING);
      
      this.executionGateway.broadcastExecutionStart(executionId, {
        approach: dto.approach,
        intentText: dto.intentText,
      });

      let result: string;
      let steps: Execution['steps'] = [];
      let tokenUsage = 0;

      switch (dto.approach) {
        case ExecutionApproach.SIMPLE:
          ({ result, tokenUsage } = await this.executeSimple(dto.intentText, executionId, dto.customPrompt));
          break;
        case ExecutionApproach.WORKFLOW:
          ({ result, steps, tokenUsage } = await this.executeWorkflow(dto.intentText, executionId, dto.customPrompt));
          break;
        case ExecutionApproach.AGENT:
          ({ result, steps, tokenUsage } = await this.executeAgent(dto.intentText, executionId, dto.customPrompt));
          break;
        default:
          throw new Error(`Unknown approach: ${dto.approach}`);
      }

      const executionTime = Date.now() - startTime;

      await this.executionRepository.updateStatus(executionId, ExecutionStatus.COMPLETED, result);
      await this.executionRepository.updateSteps(executionId, steps);
      await this.executionRepository.updateMetadata(executionId, {
        tokenUsage,
        executionTime,
        modelUsed: 'claude-3-5-sonnet',
      });

      this.executionGateway.broadcastExecutionComplete(executionId, {
        result,
        steps,
        metadata: {
          tokenUsage,
          executionTime,
          modelUsed: 'claude-3-5-sonnet',
        },
      });

    } catch (error) {
      const errorMessage = this.getErrorMessage(error);
      console.error(`❌ Execution ${executionId} failed:`, errorMessage);
      await this.executionRepository.updateStatus(
        executionId, 
        ExecutionStatus.FAILED, 
        undefined, 
        errorMessage
      );
      this.executionGateway.broadcastExecutionError(executionId, errorMessage);
    }
  }

  private async executeSimple(intentText: string, executionId: string, customPrompt?: string): Promise<{ result: string; tokenUsage: number }> {
    const prompt = customPrompt 
      ? `${customPrompt}\n\nTask: ${intentText}`
      : `Execute the following task and provide the result:\n\nTask: ${intentText}\n\nProvide a complete, working solution.`;

    const response = await this.llmService.executeSimplePrompt(prompt);
    
    return {
      result: response.content,
      tokenUsage: response.tokenUsage || 0,
    };
  }

  private async executeWorkflow(intentText: string, executionId: string, customPrompt?: string): Promise<{ result: string; steps: Execution['steps']; tokenUsage: number }> {
    const steps: Execution['steps'] = [];
    let totalTokenUsage = 0;

    // Step 1: Break down the task
    const planPrompt = customPrompt
      ? `${customPrompt}\n\nBreak down this task into 3-5 clear steps: ${intentText}`
      : `Break down the following task into 3-5 clear, actionable steps:\n\nTask: ${intentText}\n\nReturn the steps as a numbered list.`;

    const planResponse = await this.llmService.executeSimplePrompt(planPrompt);
    totalTokenUsage += planResponse.tokenUsage || 0;

    const stepDescriptions = this.parseSteps(planResponse.content);

    // Execute each step
    let accumulatedResult = '';
    for (let i = 0; i < stepDescriptions.length; i++) {
      const stepDescription = stepDescriptions[i];
      
      steps.push({
        step: i + 1,
        description: stepDescription,
        status: 'running',
      });
      
      this.executionGateway.broadcastExecutionProgress(executionId, {
        step: i + 1,
        totalSteps: stepDescriptions.length,
        status: ExecutionStatus.RUNNING,
        currentStepDescription: stepDescription,
        percentage: Math.round(((i) / stepDescriptions.length) * 100),
      });

      const stepPrompt = `Execute this step of the task:\n\nOriginal Task: ${intentText}\n\nStep ${i + 1}: ${stepDescription}\n\n${accumulatedResult ? `Previous context:\n${accumulatedResult}\n\n` : ''}Execute this step and provide the result.`;
      
      const stepResponse = await this.llmService.executeSimplePrompt(stepPrompt);
      totalTokenUsage += stepResponse.tokenUsage || 0;
      
      accumulatedResult += `\n\nStep ${i + 1} Result:\n${stepResponse.content}`;
      
      steps[i].status = 'completed';
      steps[i].output = stepResponse.content;
      
      this.executionGateway.broadcastExecutionProgress(executionId, {
        step: i + 1,
        totalSteps: stepDescriptions.length,
        status: ExecutionStatus.RUNNING,
        currentStepDescription: stepDescription,
        output: stepResponse.content,
        percentage: Math.round(((i + 1) / stepDescriptions.length) * 100),
      });
    }

    return {
      result: accumulatedResult,
      steps,
      tokenUsage: totalTokenUsage,
    };
  }

  private async executeAgent(intentText: string, executionId: string, customPrompt?: string): Promise<{ result: string; steps: Execution['steps']; tokenUsage: number }> {
    const steps: Execution['steps'] = [];
    let totalTokenUsage = 0;
    let iteration = 0;
    const maxIterations = 5;
    let currentContext = `Task: ${intentText}\n\n`;
    let isComplete = false;
    let finalResult = '';

    const systemPrompt = customPrompt || `You are an autonomous AI agent. You can:
1. THINK - Analyze the task and plan your approach
2. ACTION - Execute a specific action
3. OBSERVE - Process the result
4. FINAL - Provide the final answer when complete

Use format:\nTHINK: [your reasoning]\nACTION: [your action]\n\nor\n\nOBSERVE: [process result]\n\nor\n\nFINAL: [final answer]`;

    while (iteration < maxIterations && !isComplete) {
      iteration++;
      
      steps.push({
        step: iteration,
        description: `Agent iteration ${iteration}`,
        status: 'running',
      });

      this.executionGateway.broadcastExecutionProgress(executionId, {
        step: iteration,
        totalSteps: maxIterations,
        status: ExecutionStatus.RUNNING,
        currentStepDescription: `Agent thinking and acting (iteration ${iteration})`,
        percentage: Math.round(((iteration - 1) / maxIterations) * 100),
      });

      const agentPrompt = `${systemPrompt}\n\n${currentContext}\n\nWhat is your next thought/action?`;
      
      const response = await this.llmService.executeSimplePrompt(agentPrompt);
      totalTokenUsage += response.tokenUsage || 0;
      
      const content = response.content;
      
      steps[iteration - 1].output = content;
      steps[iteration - 1].status = 'completed';
      
      currentContext += `\nIteration ${iteration}:\n${content}\n`;

      // Check if agent provided final answer
      if (content.includes('FINAL:')) {
        isComplete = true;
        finalResult = content.split('FINAL:')[1].trim();
      }

      this.executionGateway.broadcastExecutionProgress(executionId, {
        step: iteration,
        totalSteps: maxIterations,
        status: ExecutionStatus.RUNNING,
        currentStepDescription: `Agent iteration ${iteration} complete`,
        output: content,
        percentage: Math.round((iteration / maxIterations) * 100),
      });
    }

    if (!isComplete) {
      finalResult = currentContext + '\n\n[Maximum iterations reached]';
    }

    return {
      result: finalResult,
      steps,
      tokenUsage: totalTokenUsage,
    };
  }

  private parseSteps(content: string): string[] {
    // Parse numbered list from LLM response
    const lines = content.split('\n').filter(line => line.trim());
    const steps: string[] = [];
    
    for (const line of lines) {
      const match = line.match(/^\d+[.\)]\s*(.+)/);
      if (match) {
        steps.push(match[1].trim());
      }
    }
    
    return steps.length > 0 ? steps : [content]; // Fallback to single step
  }

  async getExecution(id: string): Promise<Execution> {
    const execution = await this.executionRepository.findById(id);
    if (!execution) {
      throw new NotFoundException(`Execution with ID ${id} not found`);
    }
    return execution;
  }

  async getExecutionsByAnalysis(analysisId: string): Promise<Execution[]> {
    return await this.executionRepository.findByAnalysisId(analysisId);
  }

  private getErrorMessage(error: any): string {
    const message = error?.message || String(error);
    
    // Check for quota/rate limit errors
    if (message.includes('429') || 
        message.includes('quota') || 
        message.includes('RESOURCE_EXHAUSTED') ||
        message.includes('rate limit') ||
        message.includes('Quota exceeded')) {
      return 'AI service quota exceeded. No API credits available. Please check your billing or try again later.';
    }
    
    // Check for authentication errors
    if (message.includes('401') || 
        message.includes('authentication') || 
        message.includes('API key')) {
      return 'AI service authentication failed. Please check your API key configuration.';
    }
    
    // Check for network/connection errors
    if (message.includes('ECONNREFUSED') || 
        message.includes('ENOTFOUND') ||
        message.includes('timeout')) {
      return 'Unable to connect to AI service. Please check your network connection.';
    }
    
    // Return original message for other errors
    return message;
  }
}
