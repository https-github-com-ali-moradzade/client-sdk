import * as fs from 'fs';
import * as yaml from 'js-yaml';

// Based on config.yaml file
interface Config {
    main: {
        address: string;
        sandboxAddress: string;
    },
    services: {
        name: string;
        url: string;
        method: string;
        payload: {
            [key: string]: any;
        }
    }[]
}

export class ClientSDK {
    private readonly yamlConfigFilePath = 'config.yaml';
    private readonly config: Config;

    constructor(private readonly clientId: string, private readonly clientPassword: string) {
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
            console.log(e);
        }
    }

    callService(serviceName: string, payload: any) {
        // Call service
        const ourService = this.config.services.find(s => s.name === serviceName);
        if (ourService) {
            console.log(ourService)
        } else {
            console.log(`Service ${serviceName} not found in config file`);
        }
    }
}
