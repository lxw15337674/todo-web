import { describe, expect, it } from 'vitest';
import { getRandomImage } from '../../app/api/command/acions/randomImage';
import { parseCommand } from '../../app/api/command/command';

describe('Image Tests', () => {
    describe('Random Image', () => {
        it('should return a valid image path', async () => {
            const randomImage = await getRandomImage();
            expect(randomImage).not.toBeNull();
        });
    });

    describe('Image Commands', () => {
        it('should handle image command correctly', async () => {
            await parseCommand('img', (path) => { 
                expect(path).not.toBeNull();
                expect(path).toContain('random_awsl.png');
            });
        });
    });
}); 