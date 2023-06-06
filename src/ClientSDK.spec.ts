import {beforeEach, describe, expect, it} from "vitest";
import {ClientSDK} from "./ClientSDK";

import * as dotenv from 'dotenv';
import {v4 as uuid} from 'uuid';

dotenv.config();

it("should be able to create a ClientSDK instance", () => {
    const clientSDK = new ClientSDK();
    expect(clientSDK).toBeDefined();
});

describe('E2E Tests', () => {
    let clientSDK = new ClientSDK();

    beforeEach(() => {
        clientSDK = new ClientSDK();
    });

    describe('callService()', () => {
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
                    status: number,
                    data: {
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
                    }
                };

                // Assert
                expect(result.data.status).toEqual('DONE');
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
                    status: number;
                    data: {
                        responseCode: string;
                        trackId: string;
                        result: {
                            Amount: string;
                            BillId: string;
                            PayId: string;
                            Date: string;
                        },
                        status: string;
                    }
                };

                // Assert
                expect(result.data.status).toEqual('DONE');
            });
        });

        describe('drivingOffense', () => {
            it('should get driving offense for nid and plate number', async () => {
                // Arrange
                const payload = {
                    "trackId": uuid(),
                    "mobile": "989201911901",
                    "nationalID": "0077682361",
                    "plateNumber": "823216599",
                }

                // Act
                const result = await clientSDK.callService('drivingOffense', payload) as {
                    status: number;
                    data: {
                        responseCode: string;
                        trackId: string;
                        result: {
                            Bills: any[]
                            plateDictation: null,
                            updateViolationsDate: null,
                            inquiryDate: null,
                            inquiryTime: null,
                            billId: string;
                            paymentId: string;
                            TotalAmount: number;
                            PlateNumber: string;
                        },
                        status: string;
                    }
                };

                // Assert
                expect(result.data.status).toEqual('DONE');
            });
        });
    });
});
