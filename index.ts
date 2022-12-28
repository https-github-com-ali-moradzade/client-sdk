import {ClientSDK} from "./ClientSDK";
import {Env} from "./Env";

const clientSDK = new ClientSDK(Env.clientUsername, Env.clientPassword);
clientSDK.callService('cardToIban', {cardNumber: '1234567890'});

