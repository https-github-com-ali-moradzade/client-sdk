import {describe, expect, it} from "vitest";
import {config} from "./readYml";

describe('readYamlFile()', () => {
    // TODO: remove this test
    // it('should throw an error if invalid yaml file path provided', () => {
    //     // Arrange
    //     const errorMessage = `Failed to load config from specified yaml file`;
    //     let result;
    //
    //     // Act
    //     const resultFunction = () => {
    //         result = config;
    //     };
    //
    //     // Assert
    //     expect(resultFunction).toThrowError(errorMessage);
    // });

    it('should correctly read yaml file', () => {
        // Arrange && Act
        const result = config;

        // Assert
        expect(result).toBeDefined();
        expect(result).hasOwnProperty('main');
        expect(result).hasOwnProperty('services');
    });
});
