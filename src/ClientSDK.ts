import {readYmlFile, Service} from "./util/readYml";
import {createLogger} from "./util/logger";
import {CLIENT_SDK} from "./config";
import {validatePayload} from "./util/validatePayload";
import axios, {AxiosResponse, AxiosRequestConfig, AxiosError} from 'axios';
import {getToken} from "./util/getToken";
import {getTokenFromRedis, setTokenInRedis} from "./redis/queries";

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

        axios.interceptors.response.use((response: AxiosResponse) => {
            return response;
        }, async (error: any) => {
            if (error.response.status === 401) {
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

        if (service.method === 'get') {
            return await this.handleGetRequest(service);
        } else if (service.method === 'post') {
            return await this.handlePostRequest(service);
        }
    }

    async handleGetRequest(service: Service) {
        const params = service.payload;
        const token = await this.getValidToken(service.scope);

        let result;
        const config = {
            headers: {Authorization: `Bearer ${token}`},
            params: params
        } as AxiosRequestConfig;

        try {
            const {data} = await axios.get(service.url, config);

            result = data;
        } catch (e) {
            throw new Error(`Failed to call service ${service.name}: ${(e as AxiosError).message}`);
        }

        return result;
    }

    async handlePostRequest(service: Service) {
        const trackId = service.payload.trackId;
        delete service.payload.trackId;

        const params = service.payload;
        const token = await this.getValidToken(service.scope);
        let result;
        const config = {
            headers: {Authorization: `Bearer ${token}`},
            params: {trackId}
        } as AxiosRequestConfig;

        try {
            const {data} = await axios.post(service.url, params, config);

            result = data;
        } catch (e) {
            throw new Error(`Failed to call service ${service.name}: ${(e as AxiosError).message}`);
        }

        return result;
    }
}
