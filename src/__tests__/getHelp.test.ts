import { describe, expect, it } from 'vitest';
import { getHelp } from '../../app/api/command/acions/getHelp';

describe('Image Tests', () => {
  describe('Random Image', () => {
    it('should return a valid image path', async () => {
      const filePath = await getHelp();
      expect(filePath).not.toBeNull();
    });
  });
});
