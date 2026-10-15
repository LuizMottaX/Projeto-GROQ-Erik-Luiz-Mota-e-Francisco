import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroqModule } from '../groq/groq.module.js';
import { Transcription } from './entities/transcription.entity.js';
import { TranscriptionsController } from './transcriptions.controller.js';
import { TranscriptionsService } from './transcriptions.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Transcription]), GroqModule],
  controllers: [TranscriptionsController],
  providers: [TranscriptionsService],
})
export class TranscriptionsModule {}
