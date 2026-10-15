import { HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APIConnectionTimeoutError, APIError } from 'groq-sdk';
import { GroqService } from './groq.service.js';

describe('GroqService', () => {
  const config = new ConfigService({
    GROQ_API_KEY: 'gsk_test_key',
    GROQ_MODEL: 'whisper-large-v3-turbo',
  });
  const audio = {
    buffer: Buffer.from('audio'),
    filename: 'fala.mp3',
    mimeType: 'audio/mpeg',
  };

  function serviceFailingWith(error: unknown): GroqService {
    const service = new GroqService(config);
    // Substitui a chamada HTTP real.
    (service as any).client.audio.transcriptions.create = vi
      .fn()
      .mockRejectedValue(error);
    return service;
  }

  async function statusFor(error: unknown): Promise<number> {
    const result = await serviceFailingWith(error)
      .transcribe(audio)
      .catch((e: unknown) => e);
    expect(result).toBeInstanceOf(HttpException);
    return (result as HttpException).getStatus();
  }

  const apiError = (status: number) =>
    new APIError(status, {}, 'erro', new Headers());

  it('retorna o texto sem espaços extras', async () => {
    const service = new GroqService(config);
    (service as any).client.audio.transcriptions.create = vi
      .fn()
      .mockResolvedValue({ text: '  olá mundo \n' });

    await expect(service.transcribe(audio, 'pt')).resolves.toBe('olá mundo');
  });

  it.each([
    [400, 400],
    [422, 400],
    [413, 413],
    [429, 429],
    [401, 502],
    [403, 502],
    [500, 502],
    [503, 502],
  ])('Groq %i → HTTP %i', async (groqStatus, httpStatus) => {
    expect(await statusFor(apiError(groqStatus))).toBe(httpStatus);
  });

  it('timeout → 504', async () => {
    expect(await statusFor(new APIConnectionTimeoutError())).toBe(504);
  });

  it('erro inesperado → 502', async () => {
    expect(await statusFor(new Error('boom'))).toBe(502);
  });

  it('não expõe a chave na mensagem de erro', async () => {
    const result = (await serviceFailingWith(apiError(401))
      .transcribe(audio)
      .catch((e: unknown) => e)) as HttpException;
    expect(JSON.stringify(result.getResponse())).not.toContain('gsk_');
  });
});
