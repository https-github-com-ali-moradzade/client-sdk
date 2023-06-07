import {createLogger} from "./util/logger";
import {validatePayload} from "./util/token/validation";
import {acRestClient, ccRestClient} from "./util/restClient/restClient";
import {CLIENT_SDK} from "./config";

const logger = createLogger();

export class ClientSDK {
    /**
     * This function can only be used with cc services.
     * @param serviceName
     * @param payload
     */
    async callService(serviceName: string, payload: any) {
        logger.info(`callService -- Calling service ${serviceName} ..`);

        const {service, type} = validatePayload(serviceName, payload);
        if (type !== CLIENT_SDK.services.CC) {
            throw new Error(`You can not use callService with ${CLIENT_SDK.services.AC} type services`)
        }

        logger.info({
            service
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

        const {service, type} = validatePayload(serviceName, payload);

        logger.info({
            service: service
        }, 'Service validated successfully ..');

        return await acRestClient(service, type, refreshToken, bank)
    }
}
