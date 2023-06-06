import {describe, expect, it} from "vitest";
import {getToken} from "./getToken";

describe('getToken', async () => {
    it('should be able to get token', async () => {
        // Arrange
        const scope = 'billing:driving-offense-inquiry:get'

        // Act
        const result = await getToken(scope);

        // Assert
        expect(result).toBeDefined()
        expect(result).toBeTypeOf('string')
    })

    it('should throw error when scope is invalid', async () => {
        // Arrange
        const scope = 'invalid scope'

        // Act
        const result = await getToken(scope);

        // Assert
        expect(result).toBeUndefined()
    });
})
