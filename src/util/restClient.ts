import {Service} from "./readYml";
import {getTokenFromRedis, setTokenInRedis} from "../redis/queries";
import axios, {AxiosRequestConfig, AxiosResponse} from "axios";
import {getToken} from "./getToken";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

let currentUrl = '';
let currentService: Service;

axios.interceptors.response.use((response: AxiosResponse) => {
    return response;
}, async (error: any) => {
    if (error.response.status === 401 || error.response.status === 403) {
        const token = await getToken(currentUrl, currentService.scope);
        if (token) {
            await setTokenInRedis(currentService.scope, token);

            // Retry request
            error.config.headers.Authorization = `Bearer ${token}`;
            return axios.request(error.config);
        }
    }

    return error;
});

export async function restClient(url: string, service: Service) {
    currentUrl = url;
    currentService = service;

    const method = service.method;
    let trackId: string | undefined = undefined;

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

    const result = await axios.request(config);
    return {
        status: result.status,
        data: result.data
    }
}
