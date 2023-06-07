import {CLIENT_SDK, Service} from "../../config";

export function findService(serviceName: string): { service: Service; type: string } {
    let service: Service | undefined;

    service = CLIENT_SDK.ymlServicesConfig.services.code.find((service) => service.name === serviceName)
    if (service) {
        return {
            service,
            type: 'CODE',
        }
    }

    service = CLIENT_SDK.ymlServicesConfig.services.clientCredential.find((service) => service.name === serviceName)
    if (service) {
        return {
            service,
            type: 'CLIENT-CREDENTIAL',
        }
    }

    throw new Error(`Service ${serviceName} not found in config file`);
}

export function validatePayload(serviceName: string, payload: any): { service: Service, type: string } {
    const {service: ourService, type} = findService(serviceName);

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

    // Replace service payload, with payload
    ourService.payload = payload;

    return {
        service: ourService,
        type,
    }
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

