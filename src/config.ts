import * as dotenv from 'dotenv';

dotenv.config();

function throwError(message: string) {
    throw new Error(message);
}

export const CLIENT_SDK = {
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379')
    },
    config: {
        clientNid: process.env.CLIENT_NID || throwError('Please provide client nid in .env file'),
        clientId: process.env.CLIENT_ID || throwError('Please provide client id in .env file'),
        clientPassword: process.env.CLIENT_PASSWORD || throwError('Please provide client password in .env file'),
        ymlFilePath: __dirname + '/../config.yaml',
        logPath: process.env.LOG_PATH || '/var/tmp/ClientSDK.log',
    }
}
