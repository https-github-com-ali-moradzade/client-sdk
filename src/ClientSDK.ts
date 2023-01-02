import * as fs from 'fs';
import * as yaml from 'js-yaml';
import axios, {AxiosError} from "axios";
import {createClient, RedisClientType} from 'redis';

// Based on config.yaml file
interface Service {
    name: string,
    url: string,
    scope: string,
    method: string,
    payload: {
        [p: string]: string
    }
}

interface Config {
    main: {
        address: string;
        sandboxAddress: string;
    },
    services: Service[]
}

export class ClientSDK {
    private readonly yamlConfigFilePath = __dirname + '/../config.yaml';
    private readonly config: Config;
    private redisClient: RedisClientType;

    constructor(private readonly CLIENT_ID: string, private readonly CLIENT_PASSWORD: string,
                private readonly CLIENT_NID: string, private readonly redisUrl?: string) {
        // Read config.yaml file
        try {
            let fileContents = fs.readFileSync(this.yamlConfigFilePath, 'utf8');
            this.config = yaml.load(fileContents) as Config;

            console.log(`Config file loaded from ${this.yamlConfigFilePath} successfully ..`);
        } catch (e) {
            throw new Error(`Failed to load config from specified yaml file`);
        }

        // Replace placeholders in config file
        this.config.services.map(service => {
            service.url = service.url.replace('{clientId}', this.CLIENT_ID);
            service.url = service.url.replace('{address}', this.config.main.address);
        });

        // Connect to redis
        if (redisUrl) {
            console.log(`Connecting to redis at ${redisUrl} ..`);
            this.redisClient = createClient({
                url: redisUrl
            });

            this.redisClient.on('error', (err) => {
                console.log('Redis client connecting to specified url error: ', err);
            });
        } else {
            console.log('No redis url provided, connecting to our local redis server ..');
            this.redisClient = createClient();
            this.redisClient.on('error', (err) => {
                console.log('Redis client connecting to localhost error: ', err);
            });
        }
    }

    async callService(serviceName: string, payload: any) {
        console.log(`\nCalling service ${serviceName} ..`);

        const service = this.validate(serviceName, payload);
        service.payload = payload;

        console.log('Service validated successfully ..');

        // Check for nid in the url
        if (service.url.includes('{nid}')) {
            // Get nid from payload
            const nid = service.payload.nid;
            service.url = service.url.replace('{nid}', nid);

            // Remove nid from payload
            delete service.payload.nid;
        }
        console.log(service);

        // Call service, with axios
        // Token needs a separate call from other services
        if (serviceName == 'token') {
            return await ClientSDK.getToken(
                service.url,
                {clientId: this.CLIENT_ID, clientPassword: this.CLIENT_PASSWORD},
                service.payload as { grant_type: string; nid: string; scopes: string; }
            );
        }

        axios.interceptors.response.use(response => {
            return response;
        }, async (error) => {
            if (error.response.status === 400 || error.response.status === 401 || error.response.status === 403) {
                console.log('Token expired, getting new token ..');
                await this.cacheToken(service.scope);

                // Retry request
                error.config.headers.Authorization = `Bearer ${await this.getTokenFromRedis()}`;
                return axios.request(error.config);
            }
            console.log(error);
            return error;
        });
        await this.cacheToken(service.scope);

        if (service.method === 'get') {
            return await this.handleGetRequest(service);
        } else if (service.method === 'post') {
            return await this.handlePostRequest(service);
        }
    }

    private async cacheToken(scope: string | string[]) {
        console.log('Caching token ..');
        console.log(`Creating a new token for scope: ${scope} ..`);
        const response = await this.callService('token', {
            grant_type: 'client_credentials',
            nid: this.CLIENT_NID,
            scopes: scope
        }) as {
            result: {
                value: string
            },
            status: string
        };

        if (response.status !== 'DONE') {
            throw new Error('Failed to get token from token service');
        }

        await this.setTokenInRedis(response.result.value);
        console.log('Token cached successfully ..');
    }

    private async getTokenFromRedis() {
        await this.redisClient.connect();
        const token = await this.redisClient.get('bearerToken');
        await this.redisClient.disconnect();

        return token;
    }

    private async setTokenInRedis(token: string) {
        await this.redisClient.connect();
        await this.redisClient.set('bearerToken', token);
        await this.redisClient.disconnect();
    }

    private static async getToken(
        url: string,
        header: { clientId: string; clientPassword: string },
        body: {
            grant_type: string; nid: string; scopes: string;
        }): Promise<string> {

        try {
            const {data} = await axios.post(url, body, {
                auth: {
                    username: header.clientId,
                    password: header.clientPassword
                }
            });

            return data;
        } catch (e) {
            throw new Error(`Failed to get token from ${url} with error: ${(e as AxiosError).message}`);
        }
    }

    validate(serviceName: string, payload: any): Service {
        const ourService = this.config.services.find(s => s.name === serviceName);
        if (!ourService) {
            throw new Error(`Service ${serviceName} not found in config file`);
        }

        // Check for required parameters
        // trackId is optional in get, and required in post
        const payloadKeys = Object.keys(payload);
        if (ourService.method === 'get' && !payloadKeys.includes('trackId')) {
            payloadKeys.unshift('trackId');
        }

        if (JSON.stringify(payloadKeys) !== JSON.stringify(Object.keys(ourService.payload))) {
            throw new Error(`Invalid payload for service: ${serviceName}`);
        }

        return ourService;
    }

    async handleGetRequest(service: Service) {
        const uriParameters = service.payload;
        let result;

        try {
            const {data} = await axios.get(service.url, {
                headers: {Authorization: `Bearer ${await this.getTokenFromRedis()}`},
                params: uriParameters
            });

            result = data;
        } catch (e) {
            throw new Error(`Failed to call service ${service.name}: ${(e as AxiosError).message}`);
        }

        return result;
    }

    async handlePostRequest(service: Service) {
        const trackId = service.payload.trackId;
        delete service.payload.trackId;
        const body = service.payload;

        let result;

        try {
            const {data} = await axios.post(service.url, body, {
                headers: {Authorization: `Bearer ${await this.getTokenFromRedis()}`},
                params: {trackId}
            });

            result = data;
        } catch (e) {
            throw new Error(`Failed to call service ${service.name}: ${(e as AxiosError).message}`);
        }

        return result;
    }
}
