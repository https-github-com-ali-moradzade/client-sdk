import fs from "fs";
import * as yaml from "js-yaml";
import {createLogger} from "./logger";
import {CLIENT_SDK} from "../config";

const logger = createLogger();

// Based on config.yaml file
export interface Service {
    name: string,
    url: string,
    scope: string,
    method: string,
    payload: {
        [p: string]: string
    }
}

export interface Config {
    main: {
        address: string;
        sandboxAddress: string;
    },
    services: Service[]
}

export function readYmlFile(): Config {
    const filePath = CLIENT_SDK.config.ymlFilePath;

    try {
        let fileContents = fs.readFileSync(filePath, 'utf8');

        logger.info(`Config file loaded from ${filePath} successfully ..`)

        return yaml.load(fileContents) as Config;
    } catch (e) {
        throw new Error(`Failed to load config from specified yaml file`);
    }
}
