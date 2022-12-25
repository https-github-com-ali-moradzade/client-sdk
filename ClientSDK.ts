import * as fs from 'fs';
import * as yaml from 'js-yaml';

export class ClientSDK {
    private readonly yamlConfigFilePath = 'config.yaml';

    constructor(private readonly clientUsername: string, private readonly clientPassword: string) {
        // Read config.yaml file
        try {
            let fileContents = fs.readFileSync('./config.yaml', 'utf8');
            let data = yaml.load(fileContents);

            console.log('Content of our config.yaml file:');
            console.log(data);
        } catch (e) {
            console.log(e);
        }
    }
}
