import * as dotenv from 'dotenv';
import fs from "fs";
import * as yaml from "js-yaml";

dotenv.config();

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
    services: {
        code: Service[],
        clientCredential: Service[],
    }
}

function readYmlFile(): Config {
    const filePath = __dirname + '/../config.yaml';

    try {
        let fileContents = fs.readFileSync(filePath, 'utf8');

        return yaml.load(fileContents) as Config;
    } catch (e) {
        throw new Error(`Failed to load config from specified yaml file`);
    }
}

function throwError(message: string) {
    throw new Error(message);
}

const clientNid = process.env.CLIENT_NID || throwError('Please provide client nid in .env file');
const clientId = process.env.CLIENT_ID || throwError('Please provide client id in .env file');

const ymlServicesConfig = readYmlFile();
const url =
    process.env.DEVELOPMENT ? ymlServicesConfig.main.stagingAddress :
        process.env.USE_SANDBOX ? ymlServicesConfig.main.sandboxAddress :
            ymlServicesConfig.main.address;


const services = [
    ...ymlServicesConfig.services.code,
    ...ymlServicesConfig.services.clientCredential,
];

services.map(service => {
    service.url = service.url.replace('{clientId}', clientId as string);
    service.url = service.url.replace('{address}', url);
});

services.map(service => {
    if (service.url.includes('{nid}')) {
        service.url = service.url.replace('{nid}', clientNid as string);
    }
});

export const CLIENT_SDK = {
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379')
    },
    config: {
        clientNid,
        clientId,
        clientPassword: process.env.CLIENT_PASSWORD || throwError('Please provide client password in .env file'),
        url,
        logPath: process.env.LOG_PATH || '/var/tmp/ClientSDK.log',
    },
    ymlServicesConfig,
}
