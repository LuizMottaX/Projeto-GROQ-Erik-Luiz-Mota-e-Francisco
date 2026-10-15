import { IsOptional, Matches } from 'class-validator';

/** Campos de texto do multipart/form-data (o arquivo vem no campo `file`). */
export class CreateTranscriptionDto {
  /** Idioma do áudio em ISO-639-1 (ex.: "pt"). Se omitido, a Groq detecta. */
  @IsOptional()
  @Matches(/^[a-z]{2,3}$/, {
    message: 'language deve ser um código ISO-639-1, ex.: "pt"',
  })
  language?: string;
}
