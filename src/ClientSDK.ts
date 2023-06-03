import axios, {AxiosError, AxiosRequestConfig, AxiosResponse} from "axios";
import {readYmlFile, Service} from "./util/readYml";
import {createLogger} from "./util/logger";

const logger = createLogger();
const config = readYmlFile();

export class ClientSDK {
    constructor(private readonly CLIENT_ID: string, private readonly CLIENT_PASSWORD: string,
                private readonly CLIENT_NID: string, useSandbox?: boolean) {

        // Replace placeholders in config file
        config.services.map(service => {
            service.url = service.url.replace('{clientId}', this.CLIENT_ID);

            if (useSandbox) {
                service.url = service.url.replace('{address}', config.main.sandboxAddress);
            } else {
                service.url = service.url.replace('{address}', config.main.address);
            }
        });
    }

    // TODO: wrong wrong, 400 is response for validation or smt else, not invalid token,
    // handle cases of response other than 200
    // async callService(serviceName: string, payload: any) {
    //     this.logger.info(`Calling service ${serviceName} ..`);
    //
    //     const service = this.validate(serviceName, payload);
    //     service.payload = payload;
    //
    //     this.logger.info('Service validated successfully ..')
    //
    //     // Check for nid in the url
    //     if (service.url.includes('{nid}')) {
    //         // Get nid from payload
    //         const nid = service.payload.nid;
    //         service.url = service.url.replace('{nid}', nid);
    //
    //         // Remove nid from payload
    //         delete service.payload.nid;
    //     }
    //     this.logger.info({
    //         service: service
    //     }, 'Service url and payload are ready ..');
    //
    //     // Call service, with axios
    //     // Token needs a separate call from other services
    //     if (serviceName == 'token') {
    //         return await ClientSDK.getToken(
    //             service.url,
    //             {clientId: this.CLIENT_ID, clientPassword: this.CLIENT_PASSWORD},
    //             service.payload as { grant_type: string; nid: string; scopes: string; }
    //         );
    //     }
    //
    //     axios.interceptors.response.use((response: AxiosResponse) => {
    //         return response;
    //     }, async (error: any) => {
    //         if (error.response.status === 400 || error.response.status === 401 || error.response.status === 403) {
    //             if (error.response.status === 400)
    //                 this.logger.info(`No token stored for this key [${service.scope}], getting a new one ..`);
    //             else
    //                 this.logger.info('Token expired, getting new token ..');
    //
    //             await this.cacheToken(service.scope);
    //
    //             // Retry request
    //             error.config.headers.Authorization = `Bearer ${await ClientSDK.getTokenFromRedis(this.redisClient, service.scope)}`;
    //             return axios.request(error.config);
    //         }
    //         this.logger.error(error, `Error calling service: ${serviceName}`);
    //
    //         return error;
    //     });
    //
    //     if (service.method === 'get') {
    //         return await this.handleGetRequest(service);
    //     } else if (service.method === 'post') {
    //         return await this.handlePostRequest(service);
    //     }
    // }
    //
    // private async cacheToken(scope: string | string[]) {
    //     this.logger.info('Caching token ..');
    //     this.logger.info(`Creating a new token for scope: ${scope} ..`);
    //     const response = await this.callService('token', {
    //         grant_type: 'client_credentials',
    //         nid: this.CLIENT_NID,
    //         scopes: scope
    //     }) as {
    //         result: {
    //             value: string
    //         },
    //         status: string
    //     };
    //
    //     if (response.status !== 'DONE') {
    //         throw new Error('Failed to get token from token service');
    //     }
    //
    //     await ClientSDK.setTokenInRedis(this.redisClient, scope, response.result.value);
    //     this.logger.info('Token cached successfully ..');
    // }
    //
    // private static async getToken(
    //     url: string,
    //     header: { clientId: string; clientPassword: string },
    //     body: {
    //         grant_type: string; nid: string; scopes: string;
    //     }): Promise<string> {
    //
    //     const config = {
    //         auth: {
    //             username: header.clientId,
    //             password: header.clientPassword
    //         }
    //     } as AxiosRequestConfig;
    //
    //     try {
    //         const {data} = await axios.post(url, body, config);
    //
    //         return data;
    //     } catch (e) {
    //         throw new Error(`Failed to get token from ${url} with error: ${(e as AxiosError).message}`);
    //     }
    // }
    //
    // async handleGetRequest(service: Service) {
    //     const params = service.payload;
    //     const token = await this.getValidToken(service.scope);
    //     let result;
    //     const config = {
    //         headers: {Authorization: `Bearer ${token}`},
    //         params: params
    //     } as AxiosRequestConfig;
    //
    //     try {
    //         const {data} = await axios.get(service.url, config);
    //
    //         result = data;
    //     } catch (e) {
    //         throw new Error(`Failed to call service ${service.name}: ${(e as AxiosError).message}`);
    //     }
    //
    //     return result;
    // }
    //
    // async handlePostRequest(service: Service) {
    //     const trackId = service.payload.trackId;
    //     delete service.payload.trackId;
    //
    //     const params = service.payload;
    //     const token = await this.getValidToken(service.scope);
    //     let result;
    //     const config = {
    //         headers: {Authorization: `Bearer ${token}`},
    //         params: {trackId}
    //     } as AxiosRequestConfig;
    //
    //     try {
    //         const {data} = await axios.post(service.url, params, config);
    //
    //         result = data;
    //     } catch (e) {
    //         throw new Error(`Failed to call service ${service.name}: ${(e as AxiosError).message}`);
    //     }
    //
    //     return result;
    // }
    //
    // private async getValidToken(scope: string) {
    //     let token = await ClientSDK.getTokenFromRedis(this.redisClient, scope);
    //
    //     while (!token) {
    //         this.logger.info(`No token stored for this key [${scope}], getting a new one ..`);
    //         await this.cacheToken(scope);
    //         token = await ClientSDK.getTokenFromRedis(this.redisClient, scope);
    //     }
    //
    //     return token;
    // }
}
