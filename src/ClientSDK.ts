import * as fs from 'fs';
import * as yaml from 'js-yaml';
import axios, {AxiosError} from "axios";
import {createClient, RedisClientType} from 'redis';

// Based on config.yaml file
interface Service {
    name: string,
    url: string,
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
    private readonly yamlConfigFilePath = 'config.yaml';
    private readonly config: Config;
    private redisClient: RedisClientType;
    private bearerToken: string = '';

    constructor(private readonly CLIENT_ID: string, private readonly CLIENT_PASSWORD: string,
                private readonly tokenRedisUrl?: string) {
        // Read config.yaml file
        try {
            let fileContents = fs.readFileSync('./config.yaml', 'utf8');
            this.config = yaml.load(fileContents) as Config;

            // Replace placeholders in config file
            this.config.services.map(service => {
                service.url = service.url.replace('{clientId}', this.CLIENT_ID);
                service.url = service.url.replace('{address}', this.config.main.address);
            })

            console.log(`Config file loaded from ${this.yamlConfigFilePath} successfully ..`);
        } catch (e) {
            throw new Error(`Failed to load config from ${this.yamlConfigFilePath} file`);
        }

        // Connect to redis
        if (tokenRedisUrl) {
            this.redisClient = createClient({
                url: tokenRedisUrl
            });

            this.redisClient.on('error', (err) => {
                console.log('Redis client connecting to specified url error: ', err)
            });
        } else {
            console.log('No tokenRedisUrl provided, connecting to our local redis server');
            this.redisClient = createClient();
            this.redisClient.on('error', (err) => {
                console.log('Redis client connecting to localhost error: ', err)
            });
        }
    }

    private async getBearerToken(): Promise<string> {
        // Get the bearer token from redis
        const token = this.redisClient.get('bearerToken');
        if (token !== null) {
            console.log('Token not found in redis')
            return '';
        }

        return token;
    }

    async callService(serviceName: string, payload: any) {
        console.log(`\nCalling service ${serviceName} ..`);

        const service = this.validate(serviceName, payload);
        service.payload = payload;

        console.log('Service validated successfully ..');
        console.log(service);

        // Check for nid in the url
        if (service.url.includes('{nid}')) {
            // Get nid from payload
            const nid = service.payload.nid;
            service.url = service.url.replace('{nid}', nid);

            // Remove nid from payload
            delete service.payload.nid;
        }

        // Call service, with axios
        // Token needs a separate call from other services
        if (serviceName == 'token') {
            return await ClientSDK.getToken(
                service.url,
                {clientId: this.CLIENT_ID, clientPassword: this.CLIENT_PASSWORD},
                service.payload as { grant_type: string; nid: string; scopes: string; }
            )
        }

        if (service.method === 'get') {
            return await this.handleGetRequest(service);
        } else if (service.method === 'post') {
            return await this.handlePostRequest(service);
        }
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
                headers: {Authorization: `Bearer ${this.bearerToken}`},
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
                headers: {Authorization: `Bearer ${this.bearerToken}`},
                params: {trackId}
            });

            result = data;
        } catch (e) {
            throw new Error(`Failed to call service ${service.name}: ${(e as AxiosError).message}`);
        }

        return result;
    }
}
