import * as fs from 'fs';
import * as yaml from 'js-yaml';
import axios from "axios";
import {Env} from "./Env";

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

            console.log(`Loaded config from ${this.yamlConfigFilePath} file successfully ..`);
        } catch (e) {
            throw new Error(`Failed to load config from ${this.yamlConfigFilePath} file`);
        }
    }


    async callService(serviceName: string, payload: any) {
        const service = this.validate(serviceName, payload);
        console.log('Our service validated successfully:');
        console.log(service);

        // Call service, with axios
        if (service.method === 'get') {
            return await this.handleGetRequest(service, payload);
        } else if (service.method === 'post') {
            return await this.handlePostRequest(service, payload);
        }
    }

    validate(serviceName: string, payload: any): Service {
        const ourService = this.config.services.find(s => s.name === serviceName);
        if (!ourService) {
            throw new Error(`Service ${serviceName} not found in config file`);
        }

        // Check if payload is valid
        if (JSON.stringify(Object.keys(payload)) !== JSON.stringify(Object.keys(ourService.payload))) {
            throw new Error(`Invalid payload for service: ${serviceName}`);
        }

        return ourService;
    }

    async handleGetRequest(service: Service, uriParameters: any) {
        let result;

        try {
            const {data} = await axios.get(service.url, {
                headers: {Authorization: `Bearer ${this.bearerToken}`},
                params: uriParameters
            });

            result = data;
        } catch (e) {
            throw new Error(`Failed to call service ${service.name}: ${e.response.data.error.message}`);
        }

        return result;
    }

    async handlePostRequest(service: Service, body: any) {
        let result;

        try {
            const {data} = await axios.post(service.url, body, {
                headers: {Authorization: `Bearer ${this.bearerToken}`}
            });

            result = data;
        } catch (e) {
            throw new Error(`Failed to call service ${service.name}: ${e.response.data.error.message}`);
        }

        return result;
    }
}
