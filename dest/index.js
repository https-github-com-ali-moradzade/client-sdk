"use strict";
// import * as dotenv from 'dotenv';
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientSDK = void 0;
// import {ClientSDK} from "./ClientSDK";
// import {v4 as uuid} from 'uuid';
// dotenv.config();
// (async () => {
//     const clientSDK = new ClientSDK(process.env.CLIENT_ID || '',
//         process.env.CLIENT_PASSWORD || '', process.env.CLIENT_NID || '', process.env.REDIS_URL);
//     const result = await clientSDK.callService('billingInquiry', {
//         trackId: uuid(),
//         type: "Tel",
//         parameter: "02177689361",
//         secondParameter: "MCI"
//     })
//
//     console.log(result);
// })()
var ClientSDK_1 = require("./ClientSDK");
Object.defineProperty(exports, "ClientSDK", { enumerable: true, get: function () { return ClientSDK_1.ClientSDK; } });
