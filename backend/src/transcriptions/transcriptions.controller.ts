import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { AuthUser } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { assertValidAudio, MAX_AUDIO_BYTES } from './audio-file.js';
import { CreateTranscriptionDto } from './dto/create-transcription.dto.js';
import { TranscriptionResponseDto } from './dto/transcription-response.dto.js';
import { TranscriptionsService } from './transcriptions.service.js';

@Controller('transcriptions')
@UseGuards(JwtAuthGuard)
export class TranscriptionsController {
  constructor(private readonly transcriptionsService: TranscriptionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      // Em memória: o áudio nunca é gravado em disco.
      storage: memoryStorage(),
      limits: { fileSize: MAX_AUDIO_BYTES, files: 1 },
      // Preserva acentos no nome do arquivo.
      defParamCharset: 'utf8',
    }),
  )
  async create(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: CreateTranscriptionDto,
  ): Promise<TranscriptionResponseDto> {
    assertValidAudio(file);
    const transcription = await this.transcriptionsService.create(
      user.id,
      file,
      dto.language,
    );
    return TranscriptionResponseDto.from(transcription);
  }

  @Get()
  async findAll(
    @CurrentUser() user: AuthUser,
  ): Promise<TranscriptionResponseDto[]> {
    const transcriptions = await this.transcriptionsService.findAllByUser(
      user.id,
    );
    return transcriptions.map((t) => TranscriptionResponseDto.from(t));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.transcriptionsService.remove(user.id, id);
  }
}
