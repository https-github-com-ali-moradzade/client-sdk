import {Service} from "./readYml";
import {getTokenFromRedis, setTokenInRedis} from "../redis/queries";
import axios, {AxiosRequestConfig, AxiosResponse} from "axios";
import {getToken} from "./getToken";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';


export async function restClient(service: Service) {
    axios.interceptors.response.use((response: AxiosResponse) => {
        return response;
    }, async (error: any) => {
        if (error.response.status === 401 || error.response.status === 403) {
            const token = await getToken("https://api.staging.finnotech.ir", service.scope);
            if (token) {
                await setTokenInRedis(service.scope, token);

                // Retry request
                error.config.headers.Authorization = `Bearer ${await getTokenFromRedis(service.scope)}`;
                return axios.request(error.config);
            }
        }

        return error;
    });

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

        validateStatus: function () {
            return true;
        }
    } as AxiosRequestConfig;

    const result = await axios.request(config);
    return {
        status: result.status,
        data: result.data
    }
}
