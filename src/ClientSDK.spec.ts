import {it, expect, describe} from "vitest";
import {ClientSDK} from "./ClientSDK";

import * as dotenv from 'dotenv';
import {v4 as uuid} from 'uuid';

dotenv.config();

describe('Unit tests', () => {
    describe('constructor', () => {
        describe('readYamlFile', () => {
            it('should throw an error if invalid yaml file path provided', () => {
                // Arrange
                const invalidYamlFilePath = 'invalid/path/to/yaml/file';
                const errorMessage = `Failed to load config from specified yaml file`;

                // Act
                const resultFunction = () => {
                    // @ts-ignore
                    ClientSDK.readYamlFile(invalidYamlFilePath);
                }

                // Assert
                expect(resultFunction).toThrowError(errorMessage);
            });

            it('should correctly read yaml file is path is valid', () => {
                // Arrange
                const validYamlFilePath = './config.yaml';

                // Act
                // @ts-ignore
                const result = ClientSDK.readYamlFile(validYamlFilePath);

                // Assert
                expect(result).toBeDefined();
                expect(result).hasOwnProperty('main');
                expect(result).hasOwnProperty('services');
            });
        })
    });
});

let clientSDK: ClientSDK;

it("should be able to create a ClientSDK instance", () => {
    clientSDK = new ClientSDK(process.env.CLIENT_ID || '',
        process.env.CLIENT_PASSWORD || '', process.env.CLIENT_NID || '');
    expect(clientSDK).toBeDefined();
});

describe('E2E tests', () => {
    describe('token', () => {
        it('should call service token and get a new token with specified scopes', async () => {
            // Arrange
            const scopes = ["oak:iban-inquiry:get", "oak:group-iban-inquiry:post", "oak:group-iban-inquiry:get"];

            // Act
            const response = await clientSDK.callService(
                'token',
                {
                    grant_type: 'client_credentials',
                    nid: '4000329766',
                    scopes: scopes
                }) as {
                result: {
                    value: string;
                    scopes: string[];
                    leftTime: number;
                    creationDate: string;
                    refreshToken: string;
                    _id: string;
                },
                status: string
            };

            // Assert
            expect(response.status).toBe('DONE');
        });
    });

    describe('cardToIban', () => {
        it('should get iban for a card', async () => {
            // Arrange
            const card = "6280231304985178";
            const trackId = uuid();
            const version = "2";

            // Act
            const result = await clientSDK.callService('cardToIban', {
                trackId,
                card,
                version
            }) as {
                trackId: string,
                result: {
                    deposit: string,
                    bankName: string,
                    card: string,
                    depositOwners: string,
                    IBAN: string,
                    depositStatus: string
                },
                status: string
            };

            // Assert
            expect(result.status).toBe('DONE');
        });
    });

    describe('billingInquiry', () => {
        it('should get billing info for a phone number', async () => {
            // Arrange
            const trackId = uuid();
            const type = "Tel";
            const parameter = "02177689361";
            const secondParameter = "MCI";

            // Act
            const result = await clientSDK.callService('billingInquiry', {
                trackId,
                type,
                parameter,
                secondParameter
            }) as {
                responseCode: string;
                trackId: string;
                result: {
                    Amount: string;
                    BillId: string;
                    PayId: string;
                    Date: string;
                },
                status: string;
            };

            // Assert
            expect(result.status).toBe('DONE');
        });
    });

    describe('mobileCardVerification', () => {
        it('should verify a mobile card', async () => {
            // Arrange
            const trackId = uuid();
            const mobile = "09120000000";
            const card = "6280231304985178";

            // Act
            const result = await clientSDK.callService('mobileCardVerification', {
                trackId,
                mobile,
                card
            }) as {
                responseCode: 'FN-KCFH-20001100000',
                trackId: '3c2e6426-65aa-461b-9a90-8ffa2a5ef841',
                result: { isValid: false },
                status: 'DONE'
            };

            // Assert
            expect(result.status).toBe('DONE');
        });
    });

    describe('guarantyInquiry', () => {
        it('should get guaranty info for an nid', async () => {
            // Arrange
            const trackId = uuid();
            const nid = "4000329766";

            // Act
            const result = await clientSDK.callService('guarantyInquiry', {
                trackId,
                nid
            }) as {
                responseCode: string;
                trackId: string;
                result: {
                    guarantyNationalCode: string;
                    result: number;
                    message: string;
                },
                status: string;
            };

            // Assert
            expect(result.status).toBe('DONE');
        });
    });
});
