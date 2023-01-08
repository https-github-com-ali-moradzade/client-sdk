import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as Logger from 'bunyan';
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
    private readonly redisClient: RedisClientType = createClient();
    private readonly logger = Logger.createLogger({
        name: 'ClientSDK',
        streams: [
            {
                level: 'info',
                // stream: process.stdout,
                path: '/var/tmp/ClientSDK.info.log',
            },
            {
                level: 'error',
                // stream: process.stderr,
                path: '/var/tmp/ClientSDK.error.log',
            }
        ]
    });

    constructor(private readonly CLIENT_ID: string, private readonly CLIENT_PASSWORD: string,
                private readonly CLIENT_NID: string, private readonly redisUrl?: string) {
        // Read config.yaml file
        this.config = ClientSDK.readYamlFile(this.yamlConfigFilePath, this.logger) as Config;

        // Replace placeholders in config file
        this.config.services.map(service => {
            service.url = service.url.replace('{clientId}', this.CLIENT_ID);
            service.url = service.url.replace('{address}', this.config.main.address);
        });

        // Connect to redis
        this.redisClient = ClientSDK.connectToRedis(this.redisUrl, this.logger);
    }

    private static readYamlFile(filePath: string, logger?: Logger) {
        try {
            let fileContents = fs.readFileSync(filePath, 'utf8');

            if (logger)
                logger.info(`Config file loaded from ${filePath} successfully ..`)

            return yaml.load(fileContents) as Config;
        } catch (e) {
            throw new Error(`Failed to load config from specified yaml file`);
        }
    }

    private static connectToRedis(redisUrl: string | undefined, logger?: Logger) {
        let redisClient: RedisClientType;

        if (redisUrl) {
            if (logger)
                logger.info(`Connecting to redis at ${redisUrl} ..`);
            redisClient = createClient({
                url: redisUrl
            });

            redisClient.on('error', (err) => {
                if (logger)
                    logger.error(err, `Redis client connecting to specified url`);
            });
        } else {
            if (logger)
                logger.info('No redis url provided, connecting to our local redis server ..');
            redisClient = createClient();

            redisClient.on('error', (err) => {
                if (logger)
                    logger.error(err, 'Redis client connecting to localhost error: ');
            });
        }

        return redisClient;
    }

    async callService(serviceName: string, payload: any) {
        this.logger.info(`Calling service ${serviceName} ..`);

        const service = this.validate(serviceName, payload);
        service.payload = payload;


        this.logger.info('Service validated successfully ..')

        // Check for nid in the url
        if (service.url.includes('{nid}')) {
            // Get nid from payload
            const nid = service.payload.nid;
            service.url = service.url.replace('{nid}', nid);

            // Remove nid from payload
            delete service.payload.nid;
        }
        this.logger.info({
            service: service
        }, 'Service url and payload are ready ..');

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
                if (error.response.status === 400)
                    this.logger.info(`No token stored for this key [${service.scope}], getting a new one ..`);
                else
                    this.logger.info('Token expired, getting new token ..');

                await this.cacheToken(service.scope);

                // Retry request
                error.config.headers.Authorization = `Bearer ${await ClientSDK.getTokenFromRedis(this.redisClient, service.scope)}`;
                return axios.request(error.config);
            }
            this.logger.error(error, `Error calling service: ${serviceName}`);

            return error;
        });

        if (service.method === 'get') {
            return await this.handleGetRequest(service);
        } else if (service.method === 'post') {
            return await this.handlePostRequest(service);
        }
    }

    private async cacheToken(scope: string | string[]) {
        this.logger.info('Caching token ..');
        this.logger.info(`Creating a new token for scope: ${scope} ..`);
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

        await ClientSDK.setTokenInRedis(this.redisClient, scope, response.result.value);
        this.logger.info('Token cached successfully ..');
    }

    private static async getTokenFromRedis(redisClient: RedisClientType, scope: string | string[]) {
        await redisClient.connect();
        const token = await redisClient.get(scope.toString());
        await redisClient.disconnect();

        return token;
    }

    private static async setTokenInRedis(redisClient: RedisClientType, scope: string | string[], token: string) {
        await redisClient.connect();
        await redisClient.set(scope.toString(), token);
        await redisClient.disconnect();
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
        const params = service.payload;
        const token = await this.getValidToken(service.scope);
        let result;

        try {
            const {data} = await axios.get(service.url, {
                headers: {Authorization: `Bearer ${token}`},
                params: params
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

        const params = service.payload;
        const token = await this.getValidToken(service.scope);
        let result;

        try {
            const {data} = await axios.post(service.url, params, {
                headers: {Authorization: `Bearer ${token}`},
                params: {trackId}
            });

            result = data;
        } catch (e) {
            throw new Error(`Failed to call service ${service.name}: ${(e as AxiosError).message}`);
        }

        return result;
    }

    private async getValidToken(scope: string) {
        let token = await ClientSDK.getTokenFromRedis(this.redisClient, scope);

        while (!token) {
            this.logger.info(`No token stored for this key [${scope}], getting a new one ..`);
            await this.cacheToken(scope);
            token = await ClientSDK.getTokenFromRedis(this.redisClient, scope);
        }

        return token;
    }
}
