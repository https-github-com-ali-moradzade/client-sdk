import {describe, expect, it} from "vitest";
import {readYmlFile} from "./readYml";
import {CLIENT_SDK} from "../config";

const mainPath = CLIENT_SDK.config.ymlFilePath;

describe('readYamlFile()', () => {
    it('should throw an error if invalid yaml file path provided', () => {
        // Arrange
        CLIENT_SDK.config.ymlFilePath = '';
        const errorMessage = `Failed to load config from specified yaml file`;
        let result;

        // Act
        const resultFunction = () => {
            result = readYmlFile();
        };

        // Assert
        expect(resultFunction).toThrowError(errorMessage);
    });

    it('should correctly read yaml file', () => {
        // Arrange
        CLIENT_SDK.config.ymlFilePath = mainPath;
       
        // Act
        const result = readYmlFile();

        // Assert
        expect(result).toBeDefined();
        expect(result).hasOwnProperty('main');
        expect(result).hasOwnProperty('services');
    });
});
