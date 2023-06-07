import {describe, expect, it} from "vitest";
import {validatePayload} from "./validatePayload";


describe('validatePayload', () => {
    it('should throw an error if the service is not found', () => {
        // Arrange
        const serviceName = 'not-found';

        // Act
        const act = () => validatePayload(serviceName, {});

        // Assert
        expect(act).toThrowError(`Service ${serviceName} not found in config file`);
    })

    it('should be able to find ac service', () => {
        // Arrange
        const serviceName = 'proxyInquiry';
        const payload = {
            inquiryTrackId: '',
        };

        // Act
        const service = validatePayload(serviceName, payload);

        // Assert
        expect(service).toBeDefined();
    })

    it('should be able to find cc service', () => {
        // Arrange
        const serviceName = 'drivingOffense';
        const payload = {
            mobile: '',
            nationalID: '',
            plateNumber: '',
        }

        // Act
        const service = validatePayload(serviceName, payload);

        // Assert
        expect(service).toBeDefined();
    })

    it('should throw an error if the payload is invalid', () => {
        // Arrange
        const serviceName = 'cardToIban';
        const payload = {
            trackId: '',
            card: '',
            version: '',
            invalidField: '',
        };

        // Act
        const act = () => validatePayload(serviceName, payload);

        // Assert
        expect(act).toThrowError(`Invalid payload for service: ${serviceName}`);
    });

    describe('should not throw an error if the payload is valid', () => {
        it('cardToIban', () => {
            // Arrange
            const serviceName = 'cardToIban';
            const payload = {
                trackId: '',
                version: '',
                card: '',
            };

            // Act
            const act = () => validatePayload(serviceName, payload);

            // Assert
            expect(act).not.toThrowError();
        });

        it('drivingOffense', () => {
            // Arrange
            const serviceName = 'drivingOffense';
            const payload = {
                trackId: '',
                mobile: '',
                nationalID: '',
                plateNumber: '',
            }

            // Act
            const act = () => validatePayload(serviceName, payload);

            // Assert
            expect(act).not.toThrowError();
        });
    });

    it('should not be sensitive to the order of the keys', () => {
        // Arrange
        const serviceName = 'cardToIban';
        const payload = {
            trackId: '',
            version: '',
            card: '',
        };

        // Act
        const act = () => validatePayload(serviceName, payload);

        // Assert
        expect(act).not.toThrowError();
    });

    it('when method is get trackId is optional', () => {
        // Arrange
        const serviceName = 'cardToIban';
        const payload = {
            version: '',
            card: '',
        };

        // Act
        const act = () => validatePayload(serviceName, payload);

        // Assert
        expect(act).not.toThrowError();
    });

    it('when method is post trackId is required', () => {
        // Arrange
        const serviceName = 'token';
        const payload = {
            grant_type: '',
            nid: '',
            scopes: '',
        }

        // Act
        const act = () => {
            const service = validatePayload(serviceName, payload);
            console.log(service)
        }
        // Act && Assert
        expect(act).toThrow(`Invalid payload for service: ${serviceName}, trackId is required`)
    });

    it('should validate drivingOffense payload', () => {
        // Arrange
        const serviceName = 'drivingOffense';
        const payload = {
            mobile: '',
            nationalID: '',
            plateNumber: '',
        }

        // Act
        const act = () => validatePayload(serviceName, payload);

        // Assert
        expect(act).not.toThrowError();
    });

    it('should fill payload with payload data, if service validated successfully', () => {
        // Arrange
        const serviceName = 'drivingOffense';
        const payload = {
            mobile: 'mobile',
            nationalID: 'nationalID',
            plateNumber: 'plateNumber',
        }

        // Act
        const service = validatePayload(serviceName, payload);

        // Assert
        expect(service.payload).toEqual(payload);
    });
});
