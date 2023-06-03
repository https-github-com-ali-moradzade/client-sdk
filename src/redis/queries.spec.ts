import {describe, expect, it} from "vitest";
import {getTokenFromRedis, setTokenInRedis} from "./queries";

describe('getTokenFromRedis() & setTokenInRedis()', () => {
    describe('getTokenFromRedis()', () => {
        it('should return null if no token found in redis', async () => {
            // Arrange
            const key = 'no-token-key';

            // Act
            const result = await getTokenFromRedis(key);

            // Assert
            expect(result).toBeNull();
        });
    });

    describe('setTokenInRedis()', () => {
        it('should set token in redis', async () => {
            // Arrange
            const key = 'token';
            const value = 'token';

            // Act
            await setTokenInRedis(key, value);
            const result = await getTokenFromRedis(key);

            // Assert
            expect(result).toBe(value);
        });
    });
});

