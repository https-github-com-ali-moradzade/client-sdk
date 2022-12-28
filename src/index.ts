import * as dotenv from 'dotenv';

import {ClientSDK} from "./ClientSDK";
import {v4 as uuid} from 'uuid';

dotenv.config();

async function main() {
    try {
        const token = await ClientSDK.getToken(
            'https://apibeta.finnotech.ir/dev/v2/oauth2/token',
            {
                clientId: process.env.CLIENT_ID!,
                clientPassword: process.env.CLIENT_PASSWORD!
            },
            {
                grant_type: 'client_credentials',
                nid: process.env.NID!,
                scopes: ["oak:iban-inquiry:get", "oak:group-iban-inquiry:post", "oak:group-iban-inquiry:get", "oak:card-to-deposit:get", "oak:deposit-to-iban:get", "oak:card-statement:get", "oak:card-balance:get", "oak:check-user:get", "oak:cif-inquiry:get", "oak:shahab-inquiry:get", "oak:blacklist-inquiry:get", "oak:transaction-inquiry:get", "oak:proxy-account-inquiry:execute", "card:information:get", "credit:facility-inquiry:get", "credit:back-cheques:get", "credit:loan-info:get", "credit:guarantee-details:get", "credit:guarantee-collaterals:get", "credit:score-request:post", "credit:score-verify:post", "credit:score-renew-request:post", "credit:score-report-info:post", "credit:score-renew-report:post", "credit:score-report:post", "credit:cc-sayad-cheque-inquiry:get", "credit:cc-sayad-issuer-inquiry-cheque:post", "credit:cc-guaranty-inquiry:get", "boomrang:wages:get", "boomrang:tokens:get", "boomrang:token:delete", "boomrang:sms-verify:execute", "boomrang:sms-send:execute", "facility:card-to-iban:get", "facility:deposit-owner-verification:get", "facility:cc-bank-info:get", "facility:cc-deposit-iban:get", "facility:card-to-deposit:get", "billing:cc-inquiry:get", "billing:cc-inquiry-detail:get", "billing:driving-offense-inquiry:get", "facility:loan-info-wtlst:get", "facility:loan-info-wtlst:post", "billing:cc-negative-score:get", "facility:compare-two-images:post", "facility:finnotext:post", "facility:finnotext-inquiry:get", "facility:deposit-information:get", "wallet:information:execute", "wallet:create:post", "wallet:cash-out:execute", "wallet:traceNumber:get", "wallet:cash-in:post", "wallet:wallet-p2p:post", "wallet:purchase:post", "wallet:wallet-balance:post", "wallet:wallet-last-transactions:post", "wallet:merchant-last-transactions:post", "wallet:merchant-balance:post", "wallet:wallet-forgot-pin:post", "wallet:create-pin:post", "wallet:change-pin:post", "wallet:verify-purchase:post", "wallet:reverse-purchase:post", "wallet:track-purchase:post", "wallet:merchant-change-pin:post", "ecity:letter:get", "ecity:parkingcapacity:get", "ecity:carinfo:get", "ecity:carduties:get", "ecity:bus-eta:get", "ecity:allhighwaytoll:get", "ecity:carbill-annualtoll:get", "ecity:carbill-tehrantolls:get", "ecity:toll-list-by-city:get", "ecity:toll-citylist:get", "ecity:carbill-freeway-tollssummary:get", "ecity:air-pollution:get", "ecity:cc-postal-code-inquiry:get", "refund:track-refund-with-card:get", "refund:group-realtime-deposit:get", "facility:sms-shahkar-send:get", "facility:sms-shahkar-verification:get", "facility:compare-live-image-with-national-card-image:post", "facility:compare-live-video-with-national-card-image:post", "kyc:compare-live-image-with-national-card-image:post", "kyc:compare-two-images:post", "kyc:compare-live-video-with-national-card-image:post", "kyc:mobile-card-verification:post", "kyc:ocr-verification:post", "kyc:nid-inquiry:get", "kyc:death-status-inquiry:get", "kyc:military-inquiry:get", "kyc:cc-nid-verification:get", "facility:define-customer-account-verify-sms:get", "facility:cc-verify-define-customer-account-without-sms:post", "facility:define-customer-account-step1:post", "facility:define-customer-account-upload-media:post", "facility:define-customer-account:put", "facility:define-customer-account-inquiry:get", "facility:confirm-define-customer-account:post", "kyc:cc-verify-define-customer-account-without-sms:post", "kyc:define-customer-account-verify-sms:get", "kyc:define-customer-account-step1:post", "kyc:define-customer-account-inquiry:get", "kyc:define-customer-account-upload-media:post", "kyc:define-customer-account:put", "kyc:confirm-define-customer-account:post", "kyc:sms-shahkar-send:get", "kyc:apply-debit-card:post", "kyc:account-condition-verify-sms:get", "kyc:account-condition-upload-media:post", "kyc:account-condition-sms-shahkar-send:get", "kyc:update-account-condition:post", "kyc:inquiry-account-condition:get", "kyc:account-condition-report:get", "oak:update-account-condition-without-authorization:post",]
            });

        console.log('Token:');
        console.log(token);
    } catch (e) {
        console.log(e)
        console.error(e);
    }

    const clientSDK = new ClientSDK(process.env.CLIENT_ID || '');

    try {
        const result = await clientSDK.callService<any>('cardToIban', {
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

    try {
        const result = await clientSDK.callService('guarantyInquiry', {
            trackId: uuid(),
            nid: "4000329766"
        });

        console.log(result)
    } catch (e) {
        console.error((e as Error).message);
    }
}

main();

