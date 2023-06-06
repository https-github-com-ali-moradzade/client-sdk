import {describe, expect, it} from "vitest";
import {CLIENT_SDK} from "./config";

// TODO: add test to see all configurations work correctly
describe('readYamlFile()', () => {
    it('should correctly read yaml file', () => {
        // Arrange && Act
        const result = CLIENT_SDK.ymlServicesConfig;

        // Assert
        expect(result).toBeDefined();
        expect(result).hasOwnProperty('main');
        expect(result).hasOwnProperty('services');
    });
});
