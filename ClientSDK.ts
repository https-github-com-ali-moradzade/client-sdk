import * as fs from 'fs';
import * as yaml from 'js-yaml';

// Based on config.yaml file
interface Config {
    main: {
        baseUrl: string;
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

    constructor(private readonly clientUsername: string, private readonly clientPassword: string) {
        console.log({clientUsername, clientPassword});

        // Read config.yaml file
        try {
            let fileContents = fs.readFileSync('./config.yaml', 'utf8');
            let data = yaml.load(fileContents) as Config;

            console.log(`Loaded config from ${this.yamlConfigFilePath}:`);
            console.log(data);
            console.log(data.services[0].payload);
        } catch (e) {
            console.log(e);
        }
    }
}
