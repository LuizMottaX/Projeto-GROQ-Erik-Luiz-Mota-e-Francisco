import {
  BadGatewayException,
  BadRequestException,
  GatewayTimeoutException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  PayloadTooLargeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq, { APIConnectionTimeoutError, APIError, toFile } from 'groq-sdk';

export interface AudioInput {
  buffer: Buffer;
  filename: string;
  mimeType: string;
}

/**
 * Integração com a API de transcrição da Groq (Whisper).
 * A chave é lida do .env e nunca aparece em logs nem em respostas.
 */
@Injectable()
export class GroqService {
  private readonly logger = new Logger(GroqService.name);
  private readonly client: Groq;
  private readonly model: string;

  constructor(config: ConfigService) {
    this.client = new Groq({
      apiKey: config.getOrThrow<string>('GROQ_API_KEY'),
      timeout: 60_000,
      maxRetries: 1,
    });
    this.model = config.getOrThrow<string>('GROQ_MODEL');
  }

  async transcribe(audio: AudioInput, language?: string): Promise<string> {
    try {
      const result = await this.client.audio.transcriptions.create({
        file: await toFile(audio.buffer, audio.filename, {
          type: audio.mimeType,
        }),
        model: this.model,
        language,
        response_format: 'json',
      });
      return result.text.trim();
    } catch (error) {
      throw this.toHttpException(error);
    }
  }

  /** Traduz erros da Groq em respostas HTTP sem vazar detalhes internos. */
  private toHttpException(error: unknown): HttpException {
    if (error instanceof APIConnectionTimeoutError) {
      return new GatewayTimeoutException(
        'O serviço de transcrição demorou demais para responder',
      );
    }

    if (error instanceof APIError) {
      this.logger.warn(`Groq respondeu ${error.status ?? 'sem status'}`);

      switch (error.status) {
        case 400:
        case 422:
          return new BadRequestException(
            'Não foi possível processar este arquivo de áudio',
          );
        case 413:
          return new PayloadTooLargeException(
            'Arquivo de áudio grande demais para transcrição',
          );
        case 429:
          return new HttpException(
            'Limite de transcrições atingido. Tente novamente em instantes.',
            HttpStatus.TOO_MANY_REQUESTS,
          );
      }
    } else {
      this.logger.error('Falha inesperada ao chamar a Groq', error);
    }

    // 401/403 (chave inválida), 5xx e falhas de conexão.
    return new BadGatewayException(
      'Serviço de transcrição indisponível no momento',
    );
  }
}
