import {client} from "./client";

export async function getTokenFromRedis(scope: string) {
    return await client.get(scope);
}

export async function setTokenInRedis(scope: string, token: string) {
    await client.set(scope, token);
}
