import {describe, expect, it} from "vitest";
import {getClientCredentialToken, getTokenByRefreshCode} from "./getToken";

describe('getToken', async () => {
    describe('getClientCredentialToken', async () => {
        it('should be able to get token', async () => {
            // Arrange
            const scope = 'billing:driving-offense-inquiry:get'

            // Act
            const {token, refreshToken} = await getClientCredentialToken(scope);

            // Assert
            expect(token).toBeDefined()
            expect(token).toBeTypeOf('string')

            expect(refreshToken).toBeDefined()
            expect(refreshToken).toBeTypeOf('string')
        })

        it('should throw error when scope is invalid', async () => {
            // Arrange
            const scope = 'invalid scope'

            // Act && Assert
            await expect(getClientCredentialToken(scope)).rejects.toThrowError();
        });
    })

    describe('setToken', async () => {
        it('should get token for cc/billingInquiry', async () => {
            // Arrange
            const tokenType = 'CLIENT-CREDENTIAL';
            const scope = 'billing:driving-offense-inquiry:get'
            const {refreshToken} = await getClientCredentialToken(scope);

            // Act
            const token = await getTokenByRefreshCode(tokenType, refreshToken);

            // Assert
            expect(token).toBeDefined()
            expect(token).toBeTypeOf('string')
        })
    })
})
