import {
  collapseWhitespace,
  normalizePlaceName,
  toTitleCase,
} from './text';

describe('text normalization', () => {
  it('collapses whitespace', () => {
    expect(collapseWhitespace('  foo   bar ')).toBe('foo bar');
  });

  it('title-cases user names including hyphen and apostrophe', () => {
    expect(toTitleCase('john doe')).toBe('John Doe');
    expect(toTitleCase('  mary-jane  o\'neil ')).toBe("Mary-Jane O'Neil");
  });

  it('normalizes place names', () => {
    expect(normalizePlaceName('  central  clinic ')).toBe('Central Clinic');
    expect(normalizePlaceName('WARD 1A')).toBe('Ward 1a');
  });
});
