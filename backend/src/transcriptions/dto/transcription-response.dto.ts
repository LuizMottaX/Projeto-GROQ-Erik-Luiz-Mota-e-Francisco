import { Transcription } from '../entities/transcription.entity.js';

export class TranscriptionResponseDto {
  id: string;
  text: string;
  originalFilename: string | null;
  createdAt: Date;

  static from(transcription: Transcription): TranscriptionResponseDto {
    const dto = new TranscriptionResponseDto();
    dto.id = transcription.id;
    dto.text = transcription.text;
    dto.originalFilename = transcription.originalFilename;
    dto.createdAt = transcription.createdAt;
    return dto;
  }
}
