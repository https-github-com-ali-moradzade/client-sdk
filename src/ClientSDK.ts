import * as fs from 'fs';
import * as yaml from 'js-yaml';
import {Env} from "./Env";
import axios, {AxiosError} from "axios";

// Based on config.yaml file
interface Service {
    name: string,
    url: string,
    method: string,
    payload: {
        [p: string]: any
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
    private readonly bearerToken = Env.bearerToken;

    constructor(private readonly clientId: string) {
        // Read config.yaml file
        try {
            let fileContents = fs.readFileSync('./config.yaml', 'utf8');
            this.config = yaml.load(fileContents) as Config;

            // Replace placeholders in config file
            for (let i = 0; i < this.config.services.length; i++) {
                this.config.services[i].url = this.config.services[i].url.replace('{clientId}', this.clientId);
                this.config.services[i].url = this.config.services[i].url.replace('{address}', this.config.main.address);
            }

            console.log(`Config file loaded from ${this.yamlConfigFilePath} successfully ..`);
        } catch (e) {
            throw new Error(`Failed to load config from ${this.yamlConfigFilePath} file`);
        }
    }

    static async getToken(
        url: string,
        header: { clientId: string; clientPassword: string },
        body: {
            grant_type: string; nid: string; scopes: string | string[];
        }): Promise<string> {

        const encodedHeader = Buffer.from(`${header.clientId}:${header.clientPassword}`).toString('base64');
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

    async callService<T>(serviceName: string, payload: any) {
        console.log(`\nCalling service ${serviceName} ..`);

        const service = this.validate(serviceName, payload);
        service.payload = payload;

        console.log('Service validated successfully ..');
        console.log(service);

        // Check for nid in the url
        if (service.url.includes('{nid}')) {
            // Get nid from user
            const nid = service.payload.nid;
            service.url = service.url.replace('{nid}', nid);

            // Remove nid from payload
            delete service.payload.nid;
        }

        // Call service, with axios
        if (service.method === 'get') {
            return await this.handleGetRequest(service) as T;
        } else if (service.method === 'post') {
            return await this.handlePostRequest(service) as T;
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
            throw new Error(`Failed to call service ${service.name}: ${e}`);
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
            throw new Error(`Failed to call service ${service.name}: ${e}`);
        }

        return result;
    }
}
