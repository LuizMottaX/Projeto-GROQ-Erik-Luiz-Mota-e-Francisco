import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GroqService } from '../groq/groq.service.js';
import { Transcription } from './entities/transcription.entity.js';

@Injectable()
export class TranscriptionsService {
  constructor(
    @InjectRepository(Transcription)
    private readonly transcriptionsRepository: Repository<Transcription>,
    private readonly groqService: GroqService,
  ) {}

  /** Envia o áudio (em memória) à Groq e salva somente o texto. */
  async create(
    userId: string,
    file: Express.Multer.File,
    language?: string,
  ): Promise<Transcription> {
    const text = await this.groqService.transcribe(
      {
        buffer: file.buffer,
        filename: file.originalname,
        mimeType: file.mimetype,
      },
      language,
    );

    if (!text) {
      throw new UnprocessableEntityException(
        'Nenhuma fala foi detectada no áudio',
      );
    }

    return this.transcriptionsRepository.save(
      this.transcriptionsRepository.create({
        userId,
        text,
        originalFilename: file.originalname.slice(0, 255),
      }),
    );
  }

  findAllByUser(userId: string): Promise<Transcription[]> {
    return this.transcriptionsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /** Exclui apenas se pertencer ao usuário; caso contrário responde 404. */
  async remove(userId: string, id: string): Promise<void> {
    const result = await this.transcriptionsRepository.delete({ id, userId });
    if (!result.affected) {
      throw new NotFoundException('Transcrição não encontrada');
    }
  }
}
