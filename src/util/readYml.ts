import fs from "fs";
import * as yaml from "js-yaml";
import {createLogger} from "./logger";

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
        stagingAddress: string;
        sandboxAddress: string;
    },
    services: Service[]
}

function readYmlFile(): Config {
    const filePath = __dirname + '/../config.yaml';

    try {
        let fileContents = fs.readFileSync(filePath, 'utf8');

        logger.info(`Config file loaded from ${filePath} successfully ..`)

        return yaml.load(fileContents) as Config;
    } catch (e) {
        throw new Error(`Failed to load config from specified yaml file`);
    }
}

const config = readYmlFile();

export {config}
