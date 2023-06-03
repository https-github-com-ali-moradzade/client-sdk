import {Service} from "./readYml";
import {getTokenFromRedis} from "../redis/queries";
import axios, {AxiosError, AxiosRequestConfig} from "axios";

export async function restClient(service: Service) {
    const method = service.method;
    let trackId: string | undefined = undefined;

    if (service.payload.trackId) {
        trackId = service.payload.trackId;
        delete service.payload.trackId;
    }

    let result;
    const token = await getTokenFromRedis(service.scope)
    const config = {
        url: service.url,
        headers: {Authorization: `Bearer ${token}`},
        params: method === 'get' ? service.payload : {trackId},
        data: method === 'post' ? service.payload : undefined
    } as AxiosRequestConfig;

    try {
        const {data} = await axios.request(config);
        result = data;
    } catch (e) {
        throw new Error(`Failed to call service ${service.name}: ${(e as AxiosError).message}`);
    }

    return result;
}
