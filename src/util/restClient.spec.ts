import {describe, expect, it} from "vitest";
import {restClient} from "./restClient";
import {CLIENT_SDK} from "../config";
import {setTokenInRedis} from "../redis/queries";

describe('restClient', () => {
    it('should call service', async () => {
        // Arrange
        const service = {
            name: 'drivingOffense',
            url: `${CLIENT_SDK.config.url}/billing/v2/clients/${CLIENT_SDK.config.clientId}/drivingOffense`,
            method: 'get',
            scope: 'billing:driving-offense-inquiry:get',
            payload: {
                mobile: '09128485085',
                plateNumber: '500734744',
                nationalID: '0440299705',
            }
        };

        // Act
        const result = await restClient(service);

        // Assert
        expect(result).toBeDefined();
        expect(result.status).toBeTypeOf('number');
        expect(result.data).toBeDefined();
    });

    it('should correctly call the interceptor', async () => {
        // Arrange
        const service = {
            name: 'drivingOffense',
            url: `${CLIENT_SDK.config.url}/billing/v2/clients/${CLIENT_SDK.config.clientId}/drivingOffense`,
            method: 'get',
            scope: 'billing:driving-offense-inquiry:get',
            payload: {
                mobile: '09128485085',
                plateNumber: '500734744',
                nationalID: '0440299705',
            }
        };

        // Act
        await setTokenInRedis(service.scope, '');
        const result = await restClient(service);

        // Assert
        expect(result).toBeDefined();
        expect(result.status).toBeTypeOf('number');
        expect(result.data).toBeDefined();

        // check if interceptor worked
        expect(result.data?.error?.code).not.toEqual('VALIDATION_ERROR');
        expect(result.data?.error?.message).not.toEqual('invalid token');
    })
});
