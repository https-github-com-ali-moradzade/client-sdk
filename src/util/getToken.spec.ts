import {describe, expect, it} from "vitest";
import {getToken} from "./getToken";
import {readYmlFile} from "./readYml";

const config = readYmlFile();

describe('getToken', async () => {
    it('should be able to get token', async () => {
        // Arrange
        const address = config.main.sandboxAddress;
        const scope = 'billing:driving-offense-inquiry:get'

        // Act
        const result = await getToken(address, scope);

        // Assert
        expect(result).toBeDefined()
        expect(result).toBeTypeOf('string')
    })

    it('should throw error when scope is invalid', async () => {
        // Arrange
        const address = config.main.sandboxAddress;
        const scope = 'invalid scope'

        // Act
        const result = await getToken(address, scope);

        // Assert
        expect(result).toBeUndefined()
    });
})
