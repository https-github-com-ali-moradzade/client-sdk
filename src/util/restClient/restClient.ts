import {Service} from "../../config";
import {getTokenFromRedis, setTokenInRedis} from "../../redis/queries";
import axios, {AxiosError, AxiosRequestConfig, AxiosResponse} from "axios";
import {getClientCredentialToken, getTokenByRefreshCode} from "../token/getToken";
import {createLogger} from "../logger";

/**
 * TODO: Remove this line after tls problem solved
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const logger = createLogger();
let currentService: Service;

axios.interceptors.response.use((response: AxiosResponse) => {
    return response;
}, async (error: any) => {
    logger.info({
        errorData: (error as AxiosError).response?.data,
        errorStatus: (error as AxiosError).response?.status,
    }, 'interceptor -- error -- response');

    if (error.response.status === 401 || error.response.status === 403) {
        const {token} = await getClientCredentialToken(currentService.scope);
        if (token) {
            await setTokenInRedis(currentService.scope, token);

            // Retry request
            error.config.headers.Authorization = `Bearer ${token}`;
            return axios.request(error.config);
        }
    }

    return error;
});

export async function ccRestClient(service: Service) {
    currentService = service;

    const method = service.method;
    let trackId;

    if (service.payload.trackId) {
        trackId = service.payload.trackId;
        delete service.payload.trackId;
    }

    const token = await getTokenFromRedis(service.scope)

    const config = {
        url: service.url,
        headers: {
            Authorization: `Bearer ${token}`
        },
        params: method === 'get' ? service.payload : {trackId},
        data: method === 'post' ? service.payload : undefined,

        validateStatus: function (status: number) {
            return !(status === 401 || status == 403);
        }
    } as AxiosRequestConfig;

    let result;
    try {
        result = await axios.request(config);
    } catch (error) {
        logger.info({
            errorData: (error as AxiosError).response?.data,
            errorStatus: (error as AxiosError).response?.status,
        }, `ccRestClient -- failed to call service: ${service.name}`);

        throw error;
    }

    if (
        result.status === 400 &&
        result.data?.status === 'FAILED' &&
        result.data?.error?.code === 'VALIDATION_ERROR' &&
        result.data?.error?.message === 'invalid token'
    ) {
        const {token} = await getClientCredentialToken(currentService.scope);
        await setTokenInRedis(currentService.scope, token);

        // retry the request
        try {
            result = await axios.request({
                ...config,
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
        } catch (error) {
            logger.info({
                errorData: (error as AxiosError).response?.data,
                errorStatus: (error as AxiosError).response?.status,
            }, `ccRestClient -- retrying request -- failed to call service: ${service.name}`);

            throw error;
        }
    }

    return {
        status: result.status,
        data: result.data
    }
}

export async function acRestClient(service: Service, tokenType: string, refreshToken: string, bank?: string) {
    const method = service.method;
    let trackId: string | undefined = undefined;

    if (service.payload.trackId) {
        trackId = service.payload.trackId;
        delete service.payload.trackId;
    }

    const token = await getTokenByRefreshCode(tokenType, refreshToken, bank);

    const config = {
        url: service.url,
        headers: {
            Authorization: `Bearer ${token}`
        },
        params: method === 'get' ? service.payload : {trackId},
        data: method === 'post' ? service.payload : undefined,

        validateStatus: function (status: number) {
            return !(status === 401 || status == 403);
        }
    } as AxiosRequestConfig;

    let result;
    try {
        result = await axios.request(config);
    } catch (error) {
        logger.info({
            errorData: (error as AxiosError).response?.data,
            errorStatus: (error as AxiosError).response?.status,
        }, `acRestClient -- failed to call service: ${service.name}`);

        throw error;
    }

    return {
        status: result.status,
        data: result.data
    }
}

