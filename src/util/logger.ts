import bunyan from 'bunyan';
import {CLIENT_SDK} from "../config";

export function createLogger() {
    return bunyan.createLogger({
        name: 'ClientSDK',
        streams: [
            {
                level: 'info',
                path: CLIENT_SDK.config.logPath,
            },
            {
                level: 'error',
                path: CLIENT_SDK.config.logPath,
            }
        ],
    })
}
