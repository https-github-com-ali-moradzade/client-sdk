import {CLIENT_SDK} from "../config";
import axios, {AxiosError, AxiosRequestConfig} from "axios";
import {createLogger} from "./logger";

/**
 * TODO: Remove this line after tls problem solved
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const logger = createLogger();

export async function getToken(address: string, scope: string) {
    const data = JSON.stringify({
        grant_type: 'client_credentials',
        nid: CLIENT_SDK.config.clientNid,
        scopes: scope,
    });

    const config = {
        auth: {
            username: CLIENT_SDK.config.clientId,
            password: CLIENT_SDK.config.clientPassword,
        },
        headers: {
            'Content-Type': 'application/json',
        }
    } as AxiosRequestConfig;

    let result;
    try {
        result = await axios.post(`${address}/dev/v2/oauth2/token`, data, config);
    } catch (error) {
        logger.info({
            errorData: (error as AxiosError).response?.data,
            errorStatus: (error as AxiosError).response?.status,
        }, `getToken -- failed to get token for scope ${scope}`);
        
        return undefined;
    }

    return result?.data?.result?.value;
}
