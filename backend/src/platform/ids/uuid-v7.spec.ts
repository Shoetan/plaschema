import { createUuidV7, isUuidV7 } from './uuid-v7';

describe('createUuidV7', () => {
  it('returns a UUID version 7 string', () => {
    const id = createUuidV7();

    expect(isUuidV7(id)).toBe(true);
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });
});
