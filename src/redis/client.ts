import {createClient} from 'redis';
import {CLIENT_SDK} from "../config";

const client = createClient({
    socket: {
        host: CLIENT_SDK.redis.host,
        port: CLIENT_SDK.redis.port,
    },
});

client.on('error', (err) => {
    console.error(err?.message)
    throw err;
});

client.connect();

export {client};
