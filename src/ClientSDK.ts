import * as fs from 'fs';
import * as yaml from 'js-yaml';
import axios, {AxiosError} from "axios";

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
    private readonly bearerToken = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbklkIjoiZThmMjBhMDYtNjEzZi00ODBmLTkyODEtYTA2Yzk5N2Q3MDIzIiwicmVmcmVzaFRva2VuIjoianB4bjlmYjFyeUlXa1lEemprR1FzTlRtY1plUzluQXhjNXg5UmZZRlNhaUJPM0psWnFNWUJzbWpZOVZsZVZ1cTBCRTdTc1psMEs4QVlwR2ZhV3BBWjBJREhPbXk0Z0wxZFpSd1c3NlR4TEw5WVpsVHJ0VTJZRFRaR093b3NRcXNoWlRFclFrN1p2UlQxaG9yU0IyTm5LQUF2WElsTzBjMDI5alo5cWs2eU9jNDVnNWNTR1RjbWVKcGFSRUluclJ4N3NUNmxTTXlTMk5QM254ang0UmVKVElyRnNlU3FTemFNaFh4bURLb0E3Q0xyMjdzbGdxMkUycUg1MVQ1cTlrQSIsImNyZWF0aW9uRGF0ZSI6IjE0MDExMDExMTIzODE1IiwibGlmZVRpbWUiOjg2NDAwMDAwMCwiY2xpZW50SWQiOiJhbGltb3JhZHphZGUiLCJ1c2VySWQiOiI0MDAwMzI5NzY2IiwiYWN0aXZlIjp0cnVlLCJzY29wZXMiOlsib2FrOmliYW4taW5xdWlyeTpnZXQiLCJvYWs6Z3JvdXAtaWJhbi1pbnF1aXJ5OnBvc3QiLCJvYWs6Z3JvdXAtaWJhbi1pbnF1aXJ5OmdldCIsIm9hazpjYXJkLXRvLWRlcG9zaXQ6Z2V0Iiwib2FrOmRlcG9zaXQtdG8taWJhbjpnZXQiLCJvYWs6Y2FyZC1zdGF0ZW1lbnQ6Z2V0Iiwib2FrOmNhcmQtYmFsYW5jZTpnZXQiLCJvYWs6Y2hlY2stdXNlcjpnZXQiLCJvYWs6Y2lmLWlucXVpcnk6Z2V0Iiwib2FrOnNoYWhhYi1pbnF1aXJ5OmdldCIsIm9hazpibGFja2xpc3QtaW5xdWlyeTpnZXQiLCJvYWs6dHJhbnNhY3Rpb24taW5xdWlyeTpnZXQiLCJvYWs6cHJveHktYWNjb3VudC1pbnF1aXJ5OmV4ZWN1dGUiLCJjYXJkOmluZm9ybWF0aW9uOmdldCIsImNyZWRpdDpmYWNpbGl0eS1pbnF1aXJ5OmdldCIsImNyZWRpdDpiYWNrLWNoZXF1ZXM6Z2V0IiwiY3JlZGl0OmxvYW4taW5mbzpnZXQiLCJjcmVkaXQ6Z3VhcmFudGVlLWRldGFpbHM6Z2V0IiwiY3JlZGl0Omd1YXJhbnRlZS1jb2xsYXRlcmFsczpnZXQiLCJjcmVkaXQ6c2NvcmUtcmVxdWVzdDpwb3N0IiwiY3JlZGl0OnNjb3JlLXZlcmlmeTpwb3N0IiwiY3JlZGl0OnNjb3JlLXJlbmV3LXJlcXVlc3Q6cG9zdCIsImNyZWRpdDpzY29yZS1yZXBvcnQtaW5mbzpwb3N0IiwiY3JlZGl0OnNjb3JlLXJlbmV3LXJlcG9ydDpwb3N0IiwiY3JlZGl0OnNjb3JlLXJlcG9ydDpwb3N0IiwiY3JlZGl0OmNjLXNheWFkLWNoZXF1ZS1pbnF1aXJ5OmdldCIsImNyZWRpdDpjYy1zYXlhZC1pc3N1ZXItaW5xdWlyeS1jaGVxdWU6cG9zdCIsImNyZWRpdDpjYy1ndWFyYW50eS1pbnF1aXJ5OmdldCIsImJvb21yYW5nOndhZ2VzOmdldCIsImJvb21yYW5nOnRva2VuczpnZXQiLCJib29tcmFuZzp0b2tlbjpkZWxldGUiLCJib29tcmFuZzpzbXMtdmVyaWZ5OmV4ZWN1dGUiLCJib29tcmFuZzpzbXMtc2VuZDpleGVjdXRlIiwiZmFjaWxpdHk6Y2FyZC10by1pYmFuOmdldCIsImZhY2lsaXR5OmRlcG9zaXQtb3duZXItdmVyaWZpY2F0aW9uOmdldCIsImZhY2lsaXR5OmNjLWJhbmstaW5mbzpnZXQiLCJmYWNpbGl0eTpjYy1kZXBvc2l0LWliYW46Z2V0IiwiZmFjaWxpdHk6Y2FyZC10by1kZXBvc2l0OmdldCIsImJpbGxpbmc6Y2MtaW5xdWlyeTpnZXQiLCJiaWxsaW5nOmNjLWlucXVpcnktZGV0YWlsOmdldCIsImJpbGxpbmc6ZHJpdmluZy1vZmZlbnNlLWlucXVpcnk6Z2V0IiwiZmFjaWxpdHk6bG9hbi1pbmZvLXd0bHN0OmdldCIsImZhY2lsaXR5OmxvYW4taW5mby13dGxzdDpwb3N0IiwiYmlsbGluZzpjYy1uZWdhdGl2ZS1zY29yZTpnZXQiLCJmYWNpbGl0eTpjb21wYXJlLXR3by1pbWFnZXM6cG9zdCIsImZhY2lsaXR5OmZpbm5vdGV4dDpwb3N0IiwiZmFjaWxpdHk6Zmlubm90ZXh0LWlucXVpcnk6Z2V0IiwiZmFjaWxpdHk6ZGVwb3NpdC1pbmZvcm1hdGlvbjpnZXQiLCJ3YWxsZXQ6aW5mb3JtYXRpb246ZXhlY3V0ZSIsIndhbGxldDpjcmVhdGU6cG9zdCIsIndhbGxldDpjYXNoLW91dDpleGVjdXRlIiwid2FsbGV0OnRyYWNlTnVtYmVyOmdldCIsIndhbGxldDpjYXNoLWluOnBvc3QiLCJ3YWxsZXQ6d2FsbGV0LXAycDpwb3N0Iiwid2FsbGV0OnB1cmNoYXNlOnBvc3QiLCJ3YWxsZXQ6d2FsbGV0LWJhbGFuY2U6cG9zdCIsIndhbGxldDp3YWxsZXQtbGFzdC10cmFuc2FjdGlvbnM6cG9zdCIsIndhbGxldDptZXJjaGFudC1sYXN0LXRyYW5zYWN0aW9uczpwb3N0Iiwid2FsbGV0Om1lcmNoYW50LWJhbGFuY2U6cG9zdCIsIndhbGxldDp3YWxsZXQtZm9yZ290LXBpbjpwb3N0Iiwid2FsbGV0OmNyZWF0ZS1waW46cG9zdCIsIndhbGxldDpjaGFuZ2UtcGluOnBvc3QiLCJ3YWxsZXQ6dmVyaWZ5LXB1cmNoYXNlOnBvc3QiLCJ3YWxsZXQ6cmV2ZXJzZS1wdXJjaGFzZTpwb3N0Iiwid2FsbGV0OnRyYWNrLXB1cmNoYXNlOnBvc3QiLCJ3YWxsZXQ6bWVyY2hhbnQtY2hhbmdlLXBpbjpwb3N0IiwiZWNpdHk6bGV0dGVyOmdldCIsImVjaXR5OnBhcmtpbmdjYXBhY2l0eTpnZXQiLCJlY2l0eTpjYXJpbmZvOmdldCIsImVjaXR5OmNhcmR1dGllczpnZXQiLCJlY2l0eTpidXMtZXRhOmdldCIsImVjaXR5OmFsbGhpZ2h3YXl0b2xsOmdldCIsImVjaXR5OmNhcmJpbGwtYW5udWFsdG9sbDpnZXQiLCJlY2l0eTpjYXJiaWxsLXRlaHJhbnRvbGxzOmdldCIsImVjaXR5OnRvbGwtbGlzdC1ieS1jaXR5OmdldCIsImVjaXR5OnRvbGwtY2l0eWxpc3Q6Z2V0IiwiZWNpdHk6Y2FyYmlsbC1mcmVld2F5LXRvbGxzc3VtbWFyeTpnZXQiLCJlY2l0eTphaXItcG9sbHV0aW9uOmdldCIsImVjaXR5OmNjLXBvc3RhbC1jb2RlLWlucXVpcnk6Z2V0IiwicmVmdW5kOnRyYWNrLXJlZnVuZC13aXRoLWNhcmQ6Z2V0IiwicmVmdW5kOmdyb3VwLXJlYWx0aW1lLWRlcG9zaXQ6Z2V0IiwiZmFjaWxpdHk6c21zLXNoYWhrYXItc2VuZDpnZXQiLCJmYWNpbGl0eTpzbXMtc2hhaGthci12ZXJpZmljYXRpb246Z2V0IiwiZmFjaWxpdHk6Y29tcGFyZS1saXZlLWltYWdlLXdpdGgtbmF0aW9uYWwtY2FyZC1pbWFnZTpwb3N0IiwiZmFjaWxpdHk6Y29tcGFyZS1saXZlLXZpZGVvLXdpdGgtbmF0aW9uYWwtY2FyZC1pbWFnZTpwb3N0Iiwia3ljOmNvbXBhcmUtbGl2ZS1pbWFnZS13aXRoLW5hdGlvbmFsLWNhcmQtaW1hZ2U6cG9zdCIsImt5Yzpjb21wYXJlLXR3by1pbWFnZXM6cG9zdCIsImt5Yzpjb21wYXJlLWxpdmUtdmlkZW8td2l0aC1uYXRpb25hbC1jYXJkLWltYWdlOnBvc3QiLCJreWM6bW9iaWxlLWNhcmQtdmVyaWZpY2F0aW9uOnBvc3QiLCJreWM6b2NyLXZlcmlmaWNhdGlvbjpwb3N0Iiwia3ljOm5pZC1pbnF1aXJ5OmdldCIsImt5YzpkZWF0aC1zdGF0dXMtaW5xdWlyeTpnZXQiLCJreWM6bWlsaXRhcnktaW5xdWlyeTpnZXQiLCJreWM6Y2MtbmlkLXZlcmlmaWNhdGlvbjpnZXQiLCJmYWNpbGl0eTpkZWZpbmUtY3VzdG9tZXItYWNjb3VudC12ZXJpZnktc21zOmdldCIsImZhY2lsaXR5OmNjLXZlcmlmeS1kZWZpbmUtY3VzdG9tZXItYWNjb3VudC13aXRob3V0LXNtczpwb3N0IiwiZmFjaWxpdHk6ZGVmaW5lLWN1c3RvbWVyLWFjY291bnQtc3RlcDE6cG9zdCIsImZhY2lsaXR5OmRlZmluZS1jdXN0b21lci1hY2NvdW50LXVwbG9hZC1tZWRpYTpwb3N0IiwiZmFjaWxpdHk6ZGVmaW5lLWN1c3RvbWVyLWFjY291bnQ6cHV0IiwiZmFjaWxpdHk6ZGVmaW5lLWN1c3RvbWVyLWFjY291bnQtaW5xdWlyeTpnZXQiLCJmYWNpbGl0eTpjb25maXJtLWRlZmluZS1jdXN0b21lci1hY2NvdW50OnBvc3QiLCJreWM6Y2MtdmVyaWZ5LWRlZmluZS1jdXN0b21lci1hY2NvdW50LXdpdGhvdXQtc21zOnBvc3QiLCJreWM6ZGVmaW5lLWN1c3RvbWVyLWFjY291bnQtdmVyaWZ5LXNtczpnZXQiLCJreWM6ZGVmaW5lLWN1c3RvbWVyLWFjY291bnQtc3RlcDE6cG9zdCIsImt5YzpkZWZpbmUtY3VzdG9tZXItYWNjb3VudC1pbnF1aXJ5OmdldCIsImt5YzpkZWZpbmUtY3VzdG9tZXItYWNjb3VudC11cGxvYWQtbWVkaWE6cG9zdCIsImt5YzpkZWZpbmUtY3VzdG9tZXItYWNjb3VudDpwdXQiLCJreWM6Y29uZmlybS1kZWZpbmUtY3VzdG9tZXItYWNjb3VudDpwb3N0Iiwia3ljOnNtcy1zaGFoa2FyLXNlbmQ6Z2V0Iiwia3ljOmFwcGx5LWRlYml0LWNhcmQ6cG9zdCIsImt5YzphY2NvdW50LWNvbmRpdGlvbi12ZXJpZnktc21zOmdldCIsImt5YzphY2NvdW50LWNvbmRpdGlvbi11cGxvYWQtbWVkaWE6cG9zdCIsImt5YzphY2NvdW50LWNvbmRpdGlvbi1zbXMtc2hhaGthci1zZW5kOmdldCIsImt5Yzp1cGRhdGUtYWNjb3VudC1jb25kaXRpb246cG9zdCIsImt5YzppbnF1aXJ5LWFjY291bnQtY29uZGl0aW9uOmdldCIsImt5YzphY2NvdW50LWNvbmRpdGlvbi1yZXBvcnQ6Z2V0Iiwib2FrOnVwZGF0ZS1hY2NvdW50LWNvbmRpdGlvbi13aXRob3V0LWF1dGhvcml6YXRpb246cG9zdCJdLCJ0eXBlIjoiQ0xJRU5ULUNSRURFTlRJQUwiLCJjbGllbnRJbmZvIjoiNDlEc1FjUm5teUJxenJRVUJiSlY4dzV2VXRwNC9XUlJqTFpWeUZUQiIsImJhbmsiOiIwNjIiLCJpYXQiOjE2NzI1NjQwOTUsImV4cCI6MTY3MzQyODA5NX0.BsUgIGvvLnDox-k_E7CenlXIknVMVttRbjV8a-QghtoNEl4cLGyfQIRXwweBR9KYoplHJOMGIYawjm-9rD1pbhPzgEoCrd_2AuIkeTbay65KjL5K7mar87tRKQkCVJqTnMVxtQ1oUWoVOgiwl5Z9leE1RI8uV7Daek8aixi41fBlDJMVN5BDN8GFV93f1mxewXyFKmvojlrEHzAfx48I5Gicuf0Dh7c_Wm-Z17xj4AO_CbUxlwoI6Hhy7lL7yV2J3iKC_KQNOmndaodjSrwz-snGfvLzxlgK30hiX61j1aQk7yyqIcRH3k9WlB8qthOiYrfozqfmm_namoe44-is0w"

    constructor(private readonly CLIENT_ID: string, private readonly CLIENT_PASSWORD: string) {
        // Read config.yaml file
        try {
            let fileContents = fs.readFileSync('./config.yaml', 'utf8');
            this.config = yaml.load(fileContents) as Config;

            // Replace placeholders in config file
            for (let i = 0; i < this.config.services.length; i++) {
                this.config.services[i].url = this.config.services[i].url.replace('{clientId}', this.CLIENT_ID);
                this.config.services[i].url = this.config.services[i].url.replace('{address}', this.config.main.address);
            }

            console.log(`Config file loaded from ${this.yamlConfigFilePath} successfully ..`);
        } catch (e) {
            throw new Error(`Failed to load config from ${this.yamlConfigFilePath} file`);
        }
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
