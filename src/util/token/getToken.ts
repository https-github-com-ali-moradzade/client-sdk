import {CLIENT_SDK} from "../../config";
import axios, {AxiosError, AxiosRequestConfig} from "axios";
import {createLogger} from "../logger";

/**
 * TODO: Remove this line after tls problem solved
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const logger = createLogger();

export async function getClientCredentialToken(scope: string) {
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
        },
    } as AxiosRequestConfig;

    let result;
    try {
        result = await axios.post(`${CLIENT_SDK.config.url}/dev/v2/oauth2/token`, data, config);
    } catch (error) {
        logger.info({
            errorData: (error as AxiosError).response?.data,
            errorStatus: (error as AxiosError).response?.status,
        }, `getToken -- failed to get token for scope ${scope}`);

        throw error;
    }

    return {
        token: result?.data?.result?.value as string,
        refreshToken: result.data?.result?.refreshToken as string,
    }
}

export async function getTokenByRefreshCode(tokenType: string, refreshToken: string, bank: string = '062') {
    const data = JSON.stringify({
        grant_type: "refresh_token",
        token_type: tokenType,
        bank,
        refresh_token: refreshToken,
    });

    const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `${CLIENT_SDK.config.url}/dev/v2/oauth2/token`,
        auth: {
            username: CLIENT_SDK.config.clientId,
            password: CLIENT_SDK.config.clientPassword,
        },
        headers: {
            'Content-Type': 'application/json',
        },
        data,
    } as AxiosRequestConfig;

    let result;
    try {
        result = await axios.request(config);
    } catch (error) {
        logger.info({
            errorData: (error as AxiosError).response?.data,
            errorStatus: (error as AxiosError).response?.status,
        }, `getToken -- failed to get token`);

        throw error;
    }

    if (result.data?.status === "FAILED") {
        console.log('Error getting token')
        console.log('Request body:', {
            tokenType,
            bank,
            refreshToken: refreshToken ? refreshToken.slice(0, 10) + '...' : refreshToken
        })

        throw Error('Error getting token with refresh token')
    }

    return result.data?.result?.value;
}
