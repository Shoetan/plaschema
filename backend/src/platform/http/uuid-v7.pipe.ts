import { ParseUUIDPipe } from '@nestjs/common';

export const UuidV7Pipe = new ParseUUIDPipe({
  version: '7',
  errorHttpStatusCode: 400,
});
