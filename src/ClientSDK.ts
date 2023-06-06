import {createLogger} from "./util/logger";
import {CLIENT_SDK} from "./config";
import {validatePayload} from "./util/validatePayload";
import {restClient} from "./util/restClient";

const logger = createLogger();

export class ClientSDK {
    constructor() {
        // Replace placeholders in config file
        CLIENT_SDK.ymlServicesConfig.services.map(service => {
            service.url = service.url.replace('{clientId}', CLIENT_SDK.config.clientId as string);
            service.url = service.url.replace('{address}', CLIENT_SDK.config.url);
        });
    }

    async callService(serviceName: string, payload: any) {
        logger.info(`Calling service ${serviceName} ..`);

        // const service = this.validate(serviceName, payload);
        const service = validatePayload(serviceName, payload);
        service.payload = payload;

        logger.info('Service validated successfully ..')

        // Check for nid in the url
        if (service.url.includes('{nid}')) {
            // Get nid from payload
            const nid = service.payload.nid;
            service.url = service.url.replace('{nid}', nid);

            // Remove nid from payload
            delete service.payload.nid;
        }
        logger.info({
            service: service
        }, 'Service url and payload are ready ..');

        return await restClient(service);
    }
}
