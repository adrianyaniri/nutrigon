import { describe, it, expect } from 'vitest';
import { slugify } from './slug.util.js';

describe('slugify', () => {
  it('should convert strings to lowercase and replace spaces with hyphens', () => {
    expect(slugify('Frutos Secos')).toBe('frutos-secos');
  });

  it('should remove accents and diacritics', () => {
    expect(slugify('Café y Té Verde')).toBe('cafe-y-te-verde');
    expect(slugify('Pedro Díaz')).toBe('pedro-diaz');
  });

  it('should remove special characters and symbols', () => {
    expect(slugify('Harinas & Féculas (100% Puras!)')).toBe('harinas-feculas-100-puras');
  });

  it('should trim leading and trailing dashes', () => {
    expect(slugify('---Almendras---')).toBe('almendras');
  });
});
