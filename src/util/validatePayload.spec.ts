import {describe, expect, it} from "vitest";
import {validatePayload} from "./validatePayload";
import {readYmlFile} from "./readYml";

const config = readYmlFile();

describe('validatePayload', () => {
    it('should throw an error if the service is not found', () => {
        // Arrange
        const serviceName = 'not-found';

        // Act
        const act = () => validatePayload(config, serviceName, {});

        // Assert
        expect(act).toThrowError(`Service ${serviceName} not found in config file`);
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
        const act = () => validatePayload(config, serviceName, payload);

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
            const act = () => validatePayload(config, serviceName, payload);

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
            const act = () => validatePayload(config, serviceName, payload);

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
        const act = () => validatePayload(config, serviceName, payload);

        // Assert
        expect(act).not.toThrowError();
    });
});
