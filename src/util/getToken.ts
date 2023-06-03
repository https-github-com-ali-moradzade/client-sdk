import {CLIENT_SDK} from "../config";
import axios from "axios";
import {createLogger} from "./logger";

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
    }

    let result;
    try {
        result = await axios.post(`${address}/dev/v2/oauth2/token`, data, config);
    } catch (error) {
        logger.info(`Failed to get token for scope ${scope}`)
        return undefined;
    }

    return result?.data?.result?.value;
}
