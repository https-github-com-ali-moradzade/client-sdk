import {describe, expect, it} from "vitest";
import {acRestClient, ccRestClient} from "./restClient";
import {setTokenInRedis} from "../redis/queries";
import {validatePayload} from "./validatePayload";

describe('restClient', () => {
    describe('ccRestClient', () => {
        it('should correctly call a cc service', async () => {
            // Arrange
            const serviceName = 'drivingOffense';
            const payload = {
                mobile: '09128485085',
                plateNumber: '500734744',
                nationalID: '0440299705',
            }
            const service = validatePayload(serviceName, payload);

            // Act
            const result = await ccRestClient(service);

            // Assert
            expect(result).toBeDefined();
            expect(result.status).toBeTypeOf('number');
            expect(result.data).toBeDefined();
        });

        it('should correctly call the interceptor', async () => {
            // Arrange
            const serviceName = 'drivingOffense';
            const payload = {
                mobile: '09128485085',
                plateNumber: '500734744',
                nationalID: '0440299705',
            }
            const service = validatePayload(serviceName, payload);

            // Act
            await setTokenInRedis(service.scope, '');
            const result = await ccRestClient(service);

            // Assert
            expect(result).toBeDefined();
            expect(result.status).toBeTypeOf('number');
            expect(result.data).toBeDefined();

            // check if interceptor worked
            expect(result.data?.error?.code).not.toEqual('VALIDATION_ERROR');
            expect(result.data?.error?.message).not.toEqual('invalid token');
        });
    })

    describe('acRestClient', () => {
        // TODO: test this
        it.skip('should correctly call a ac service', async () => {
            // Arrange
            const serviceName = 'proxyInquiry';
            const payload = {
                inquiryTrackId: 'put inquiryTrackId',
            }
            const service = validatePayload(serviceName, payload);
            const refreshToken = 'put refresh token'

            // Act
            const result = await acRestClient(service, refreshToken);

            // Assert
            expect(result).toBeDefined();
            expect(result.status).toBeTypeOf('number');
            expect(result.data).toBeDefined();
        });

        it.skip('should correctly call a cc service', async () => {
            // Arrange
            const serviceName = 'drivingOffense';
            const payload = {
                mobile: '09128485085',
                plateNumber: '500734744',
                nationalID: '0440299705',
            }
            const service = validatePayload(serviceName, payload);
            const refreshToken = 'put refresh token'

            // Act
            const result = await acRestClient(service, refreshToken);

            // Assert
            expect(result).toBeDefined();
            expect(result.status).toBeTypeOf('number');
            expect(result.data).toBeDefined();
        });

    })
});
