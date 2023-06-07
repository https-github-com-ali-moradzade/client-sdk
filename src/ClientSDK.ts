import {createLogger} from "./util/logger";
import {validatePayload} from "./util/validatePayload";
import {restClient} from "./util/restClient";

const logger = createLogger();

export class ClientSDK {
    async callService(serviceName: string, payload: any) {
        logger.info(`Calling service ${serviceName} ..`);

        // const service = this.validate(serviceName, payload);
        const service = validatePayload(serviceName, payload);

        logger.info({
            service: service
        }, 'Service validated successfully ..');

        return await restClient(service);
    }
}
