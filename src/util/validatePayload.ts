import {CLIENT_SDK, Service} from "../config";

export function validatePayload(serviceName: string, payload: any): Service {
    const services = [
        ...CLIENT_SDK.ymlServicesConfig.services.code,
        ...CLIENT_SDK.ymlServicesConfig.services.clientCredential,
    ];

    const ourService = services.find(s => s.name === serviceName);

    if (!ourService) {
        throw new Error(`Service ${serviceName} not found in config file`);
    }

    // Check for required parameters
    // trackId is optional in get, and required in post
    const payloadKeys = Object.keys(payload);
    if (ourService.method === 'post' && !payloadKeys.includes('trackId')) {
        throw new Error(`Invalid payload for service: ${serviceName}, trackId is required`);
    }

    delete payload.trackId;
    delete ourService.payload.trackId;

    if (!haveSameKeys(payload, ourService.payload)) {
        throw new Error(`Invalid payload for service: ${serviceName}`);
    }

    return ourService;
}

function haveSameKeys(obj1: any, obj2: any) {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    // Check if the number of keys is the same
    if (keys1.length !== keys2.length) {
        return false;
    }

    // Check if each key in obj1 is also present in obj2
    for (let key of keys1) {
        if (!keys2.includes(key)) {
            return false;
        }
    }

    // Check if each key in obj2 is also present in obj1
    for (let key of keys2) {
        if (!keys1.includes(key)) {
            return false;
        }
    }

    return true;
}

