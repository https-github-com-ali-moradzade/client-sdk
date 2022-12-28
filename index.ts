import {ClientSDK} from "./ClientSDK";
import {Env} from "./Env";
import { v4 as uuid } from 'uuid';

async function main() {
    const clientSDK = new ClientSDK(Env.clientId);

    try {
        const result = await clientSDK.callService('cardToIban', {
            trackId: uuid(),
            card: "6280231304985178",
            version: "2"
        })

        console.log(result);
    } catch (e) {
        console.error((e as Error).message);
    }

    try {
        const result = await clientSDK.callService('billingInquiry', {
            trackId: uuid(),
            type: "Tel",
            parameter: "02177689361",
            secondParameter: "MCI"
        })

        console.log(result)
    } catch (e) {
        console.error((e as Error).message);
    }

    try {
        const result = await clientSDK.callService('mobileCardVerification', {
            trackId: uuid(),
            mobile: "09120000000",
            card: "6280231304985178",
        });

        console.log(result)
    } catch (e) {
        console.error((e as Error).message);
    }
}

main();

