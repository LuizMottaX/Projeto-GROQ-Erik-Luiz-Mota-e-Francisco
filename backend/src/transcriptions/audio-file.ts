import { BadRequestException } from '@nestjs/common';
import { extname } from 'node:path';

/** Limite do plano gratuito da Groq. */
export const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

/** Formatos aceitos pela Groq. */
export const ALLOWED_AUDIO_EXTENSIONS = [
  '.flac',
  '.m4a',
  '.mp3',
  '.mp4',
  '.mpeg',
  '.mpga',
  '.ogg',
  '.opus',
  '.wav',
  '.webm',
];

/**
 * Valida presença e tipo do arquivo. O tamanho é limitado antes, pelo multer
 * (que responde 413 automaticamente).
 */
export function assertValidAudio(
  file: Express.Multer.File | undefined,
): asserts file is Express.Multer.File {
  if (!file || file.size === 0) {
    throw new BadRequestException('Envie um arquivo de áudio no campo "file"');
  }

  const extension = extname(file.originalname).toLowerCase();
  const mimeOk =
    file.mimetype.startsWith('audio/') ||
    file.mimetype === 'video/mp4' ||
    file.mimetype === 'video/webm' ||
    file.mimetype === 'application/octet-stream';

  if (!ALLOWED_AUDIO_EXTENSIONS.includes(extension) || !mimeOk) {
    throw new BadRequestException(
      `Formato não suportado. Use: ${ALLOWED_AUDIO_EXTENSIONS.join(', ')}`,
    );
  }
}
