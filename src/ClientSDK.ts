import {createLogger} from "./util/logger";
import {validatePayload} from "./util/validatePayload";
import {acRestClient, ccRestClient} from "./util/restClient";

const logger = createLogger();

export class ClientSDK {
    /**
     * This function can only be used with cc services.
     * @param serviceName
     * @param payload
     */
    async callService(serviceName: string, payload: any) {
        // TODO: add validation to check service is actually cc
        logger.info(`callService -- Calling service ${serviceName} ..`);

        const service = validatePayload(serviceName, payload);

        logger.info({
            service: service
        }, 'Service validated successfully ..');

        return await ccRestClient(service);
    }

    /**
     * This function can be used with all services, but you have to provide `refresh_token` for each service,
     * each time you want to call that service, It gets token based on that `refresh_token` and gets token for that
     * service and calls the service.
     * @param serviceName name of service you want to call
     * @param payload payload of service, if method=get --> query params, method=post --> body
     * @param refreshToken refresh token of that service
     * @param bank optional, if you need to pass bank, fill this parameter
     */
    async callServiceByRefreshToken(serviceName: string, payload: any, refreshToken: string, bank?: string) {
        logger.info(`callServiceByRefreshToken -- Calling service ${serviceName} ..`);

        const service = validatePayload(serviceName, payload);

        logger.info({
            service: service
        }, 'Service validated successfully ..');

        return await acRestClient(service, refreshToken, bank)
    }
}
