import * as dotenv from 'dotenv';

dotenv.config();
export const CLIENT_SDK = {
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379')
    },
    config: {
        clientNid: process.env.CLIENT_NID || 'invalid client nid',
        clientId: process.env.CLIENT_ID || 'invalid client id',
        clientPassword: process.env.CLIENT_PASSWORD || 'invalid client password',
        ymlFilePath: __dirname + '/../config.yaml',
        logPath: process.env.LOG_PATH,
    }
}
