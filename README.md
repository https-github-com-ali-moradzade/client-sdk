# Client SDK

This is a wrapper to call the apis from [Finnotech](https://finnotech.ir/doc/), note that this client only works
with `Client_Credential` type services.

## Installation

You can install this package with the following command:

```bash
npm i finnotech-client-sdk
```

### Create a new client

You can create a new client with the following code:

```typescript
import {ClientSDK} from "./ClientSDK";

const clientSDK = new ClientSDK(); // to use sandbox url: new ClientSDK(true);
```

You should configure .env file before using client:

```dotenv
# Client Configuration
CLIENT_NID=""
CLIENT_ID=""
CLIENT_PASSWORD=""

# Redis Configuration
REDIS_HOST="localhost"
REDIS_PORT="6379"

# Logger Configuration
LOG_PATH="/var/tmp/ClientSDK.log"
```

`CLIENT_ID` is the client id which you get from [Finnotech](https://finnotech.ir/clients), in applications section.  
`CLIENT_PASSWORD` is the client password which you get from [Finnotech](https://finnotech.ir/clients), in applications
section.  
`CLIENT_NID` is the client nid

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
const clientSDK = new ClientSDK();

const result = await clientSDK.callService('billingInquiry', {
    trackId: uuid(),
    type: "Tel",
    parameter: "021xxxxxxx1",
    secondParameter: "MCI"
})

console.log(result);
```

Resulting output should look like:

```javascript
{
    responseCode: 'FN-BGVH-20000000000',
    trackId: 'de8d92dd-e6fd-4dee-b61b-1a80d1a771dd',
    result: {
        Amount: '1195000',
        BillId: '89xxxxxxx48',
        PayId: '1xxxxxxx9',
        Date: ''
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

Configure log path: `LOG_PATH` in `.env` file.

```dotenv
# Logger Configuration
LOG_PATH="/var/tmp/ClientSDK.log"
```
