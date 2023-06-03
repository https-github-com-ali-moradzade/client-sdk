import {readYmlFile} from "./util/readYml";
import {createLogger} from "./util/logger";
import {CLIENT_SDK} from "./config";
import {validatePayload} from "./util/validatePayload";
import axios, {AxiosResponse} from 'axios';
import {getToken} from "./util/getToken";
import {getTokenFromRedis, setTokenInRedis} from "./redis/queries";
import {restClient} from "./util/restClient";

const logger = createLogger();
const config = readYmlFile();

export class ClientSDK {
    private url = '';

    constructor(useSandbox?: boolean) {
        // Replace placeholders in config file
        config.services.map(service => {
            service.url = service.url.replace('{clientId}', CLIENT_SDK.config.clientId);

            if (useSandbox) {
                this.url = config.main.sandboxAddress;
                service.url = service.url.replace('{address}', config.main.sandboxAddress);
            } else {
                this.url = config.main.address;
                service.url = service.url.replace('{address}', config.main.address);
            }
        });
    }

    async callService(serviceName: string, payload: any) {
        logger.info(`Calling service ${serviceName} ..`);

        // const service = this.validate(serviceName, payload);
        const service = validatePayload(config, serviceName, payload);
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

        axios.interceptors.response.use((response: AxiosResponse) => {
            return response;
        }, async (error: any) => {
            if (error.response.status === 401 || error.response.status === 403) {
                const token = await getToken(this.url, service.scope);
                if (token) {
                    await setTokenInRedis(service.scope, token);

                    // Retry request
                    error.config.headers.Authorization = `Bearer ${await getTokenFromRedis(service.scope)}`;
                    return axios.request(error.config);
                }
            }
            logger.error(error, `Error calling service: ${serviceName}`);

            return error;
        });

        return await restClient(service);
    }
}
