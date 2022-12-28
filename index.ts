import {ClientSDK} from "./ClientSDK";
import {Env} from "./Env";

const clientSDK = new ClientSDK(Env.clientId);
clientSDK.callService('cardToIban', {
    trackId: "cardToIban-027",
    card: "6280231304985178",
    version: "2"
})
    .then(data => {
        console.log(data);
    })
    .catch(err => {
        console.log(err.message)
    })
