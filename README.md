# Client SDK

This is a wrapper to call the apis from [Finnotech](https://finnotech.ir/doc/), note that this client only works
with `Client_Credential` type services.

## Usage

You can only use this client with services in the `config.yaml` file.

To create a new client sdk we have:

### Create a new client

You can create a new client with the following code:

```typescript
import {ClientSDK} from "./ClientSDK";

const clientSDK = new ClientSDK(clientId, clientPassword, clientNid, redisUrl);
```

`clientId` is the client id which you get from [Finnotech](https://finnotech.ir/clients), in applications section.  
`clientPassword` is the client password which you get from [Finnotech](https://finnotech.ir/clients), in applications
section.  
`clientNid` is the client nid
`redisUrl` is the redis url, and is optional. if you don't pass it, it will use `redis://localhost:6379`

`redisUrl` is used, so if your tokens are expired, it will refresh them automatically and cache them in redis.

You can put these information in `.env` file, and use `dotenv` package to load them.  
Sample `.env` file is provided for you in `.env.example` file.

### Call a service

You can call a service with `callService` method:

```typescript
const response = await clientSDK.callService(serviceName, payload);
```

`serviceName` is the name of the service which you want to call, and it should be in `config.yaml` file.  
`payload` is the payload which you want to send to the service.

Note: `callService` method returns a promise, so you should use `await` keyword.

## Run

To automatically compile and run the project, you can put your codes inside `src/index.ts` file and run the following
command:

```bash
npm run start
```

## Docker

To run the project in docker, you can use the following command:

```bash
docker-compose up --build
```
This command will build the images and run your index.ts file and all the tests.

For stopping the docker, you can use the following command:

```bash
docker-compose down
```

## Example

```typescript
import {ClientSDK} from "./ClientSDK";
import {v4 as uuid} from 'uuid';

// Create a new client, use redis from localhost
const clientSDK = new ClientSDK(clientId, clientPassword, clientNid);

const result = await clientSDK.callService('billingInquiry', {
    trackId: uuid(),
    type: "Tel",
    parameter: "02177689361",
    secondParameter: "MCI"
})

console.log(result);
```

Resulting output should look like:

```javascript
{
    responseCode: 'FN-BGVH-20000000000',
        trackId : 'de8d92b3-e6fd-47ee-b61b-1a80d1a771c6',
        result : {
            Amount: '1195000',
            BillId : '894156221148',
            PayId : '119511559',
            Date : ''
    } ,
    status: 'DONE'
}
```

## Testing

To test the client, you can use following command:

```bash
npm run test
```

Client sdk tests are in `ClientSDK.spec.ts` file.

Note: Be sure that you have `redis` installed and running on `redis://localhost:6379`, if you don't pass `redisUrl` to
the client.

## Logging

There are two types of logs in this project, `info` and `error`.

You can see info logs in the `/var/tmp/client-sdk.info.log` file.
You can see error logs in the `/var/tmp/client-sdk.error.log` file.

Logs are in json format, you can use:

Too see info logs:

```bash
cat /var/tmp/ClientSDK.info.log | bunyan
```

Too see error logs:

```bash
cat /var/tmp/ClientSDK.error.log | bunyan
```

We piped output to bunyan, to pretty print the logs, this is a sample output for our `info`:

```bash
[2023-01-08T07:43:31.356Z]  INFO: ClientSDK/21700 on ali-finnotech: Config file loaded from client-sdk/dest/../config.yaml successfully ..
[2023-01-08T07:43:31.360Z]  INFO: ClientSDK/21700 on ali-finnotech: No redis url provided, connecting to our local redis server ..
[2023-01-08T07:43:31.361Z]  INFO: ClientSDK/21700 on ali-finnotech: Calling service billingInquiry ..
[2023-01-08T07:43:31.361Z]  INFO: ClientSDK/21700 on ali-finnotech: Service validated successfully ..
[2023-01-08T07:43:31.361Z]  INFO: ClientSDK/21700 on ali-finnotech: Service url and payload are ready ..
service: {
    "name": "billingInquiry",
    "url": "https://apibeta.finnotech.ir/billing/v2/clients/alimoradzade/billingInquiry",
    "scope": "billing:cc-inquiry:get",
    "method": "get",
    "payload": {
        "trackId": "2fea673c-becf-4e35-8063-f6ab8812241a",
        "type": "Tel",
        "parameter": "02177689361",
        "secondParameter": "MCI"
    }
}
```

Also you can change log path in `ClientSDK.ts` file, and put your own path.

```typescript
private readonly
logger = Logger.createLogger({
    name: 'ClientSDK',
    streams: [
        {
            level: 'info',
            // stream: process.stdout,
            path: 'your-custom-path-here/ClientSDK.info.log'
        },
        {
            level: 'error',
            // stream: process.stderr,
            path: 'your-custom-path-here/ClientSDK.error.log'
        }
    ]
});
```

If you want to see the logs in console, you can uncomment the `stream` lines, and comment the `path` lines.

