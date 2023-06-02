"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientSDK = void 0;
const fs = __importStar(require("fs"));
const yaml = __importStar(require("js-yaml"));
const Logger = __importStar(require("bunyan"));
const axios_1 = __importDefault(require("axios"));
const redis_1 = require("redis");
class ClientSDK {
    constructor(CLIENT_ID, CLIENT_PASSWORD, CLIENT_NID, REDIS_URL) {
        this.CLIENT_ID = CLIENT_ID;
        this.CLIENT_PASSWORD = CLIENT_PASSWORD;
        this.CLIENT_NID = CLIENT_NID;
        this.REDIS_URL = REDIS_URL;
        this.yamlConfigFilePath = __dirname + '/../config.yaml';
        this.logger = Logger.createLogger({
            name: 'ClientSDK',
            streams: [
                {
                    level: 'info',
                    // stream: process.stdout,
                    path: '/var/tmp/ClientSDK.info.log',
                },
                {
                    level: 'error',
                    // stream: process.stderr,
                    path: '/var/tmp/ClientSDK.error.log',
                }
            ]
        });
        // Connect to redis
        this.redisClient = ClientSDK.connectToRedis(this.REDIS_URL, this.logger);
        // Read config.yaml file
        this.config = ClientSDK.readYamlFile(this.yamlConfigFilePath, this.logger);
        // Replace placeholders in config file
        this.config.services.map(service => {
            service.url = service.url.replace('{clientId}', this.CLIENT_ID);
            service.url = service.url.replace('{address}', this.config.main.address);
        });
    }
    static readYamlFile(filePath, logger) {
        try {
            let fileContents = fs.readFileSync(filePath, 'utf8');
            if (logger)
                logger.info(`Config file loaded from ${filePath} successfully ..`);
            return yaml.load(fileContents);
        }
        catch (e) {
            throw new Error(`Failed to load config from specified yaml file`);
        }
    }
    static connectToRedis(redisUrl, logger) {
        let redisClient;
        if (redisUrl) {
            if (logger)
                logger.info(`Connecting to redis server on ${redisUrl} ..`);
            redisClient = (0, redis_1.createClient)({
                url: redisUrl
            });
        }
        else {
            if (logger)
                logger.info('Connecting to localhost redis server ..');
            redisClient = (0, redis_1.createClient)();
        }
        return redisClient;
    }
    callService(serviceName, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info(`Calling service ${serviceName} ..`);
            const service = this.validate(serviceName, payload);
            service.payload = payload;
            this.logger.info('Service validated successfully ..');
            // Check for nid in the url
            if (service.url.includes('{nid}')) {
                // Get nid from payload
                const nid = service.payload.nid;
                service.url = service.url.replace('{nid}', nid);
                // Remove nid from payload
                delete service.payload.nid;
            }
            this.logger.info({
                service: service
            }, 'Service url and payload are ready ..');
            // Call service, with axios
            // Token needs a separate call from other services
            if (serviceName == 'token') {
                return yield ClientSDK.getToken(service.url, { clientId: this.CLIENT_ID, clientPassword: this.CLIENT_PASSWORD }, service.payload);
            }
            axios_1.default.interceptors.response.use((response) => {
                return response;
            }, (error) => __awaiter(this, void 0, void 0, function* () {
                if (error.response.status === 400 || error.response.status === 401 || error.response.status === 403) {
                    if (error.response.status === 400)
                        this.logger.info(`No token stored for this key [${service.scope}], getting a new one ..`);
                    else
                        this.logger.info('Token expired, getting new token ..');
                    yield this.cacheToken(service.scope);
                    // Retry request
                    error.config.headers.Authorization = `Bearer ${yield ClientSDK.getTokenFromRedis(this.redisClient, service.scope)}`;
                    return axios_1.default.request(error.config);
                }
                this.logger.error(error, `Error calling service: ${serviceName}`);
                return error;
            }));
            if (service.method === 'get') {
                return yield this.handleGetRequest(service);
            }
            else if (service.method === 'post') {
                return yield this.handlePostRequest(service);
            }
        });
    }
    cacheToken(scope) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info('Caching token ..');
            this.logger.info(`Creating a new token for scope: ${scope} ..`);
            const response = yield this.callService('token', {
                grant_type: 'client_credentials',
                nid: this.CLIENT_NID,
                scopes: scope
            });
            if (response.status !== 'DONE') {
                throw new Error('Failed to get token from token service');
            }
            yield ClientSDK.setTokenInRedis(this.redisClient, scope, response.result.value);
            this.logger.info('Token cached successfully ..');
        });
    }
    static getTokenFromRedis(redisClient, scope) {
        return __awaiter(this, void 0, void 0, function* () {
            yield redisClient.connect();
            const token = yield redisClient.get(scope.toString());
            yield redisClient.disconnect();
            return token;
        });
    }
    static setTokenInRedis(redisClient, scope, token) {
        return __awaiter(this, void 0, void 0, function* () {
            yield redisClient.connect();
            yield redisClient.set(scope.toString(), token);
            yield redisClient.disconnect();
        });
    }
    static getToken(url, header, body) {
        return __awaiter(this, void 0, void 0, function* () {
            const config = {
                auth: {
                    username: header.clientId,
                    password: header.clientPassword
                }
            };
            try {
                const { data } = yield axios_1.default.post(url, body, config);
                return data;
            }
            catch (e) {
                throw new Error(`Failed to get token from ${url} with error: ${e.message}`);
            }
        });
    }
    validate(serviceName, payload) {
        const ourService = this.config.services.find(s => s.name === serviceName);
        if (!ourService) {
            throw new Error(`Service ${serviceName} not found in config file`);
        }
        // Check for required parameters
        // trackId is optional in get, and required in post
        const payloadKeys = Object.keys(payload);
        if (ourService.method === 'get' && !payloadKeys.includes('trackId')) {
            payloadKeys.unshift('trackId');
        }
        if (JSON.stringify(payloadKeys) !== JSON.stringify(Object.keys(ourService.payload))) {
            throw new Error(`Invalid payload for service: ${serviceName}`);
        }
        return ourService;
    }
    handleGetRequest(service) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = service.payload;
            const token = yield this.getValidToken(service.scope);
            let result;
            const config = {
                headers: { Authorization: `Bearer ${token}` },
                params: params
            };
            try {
                const { data } = yield axios_1.default.get(service.url, config);
                result = data;
            }
            catch (e) {
                throw new Error(`Failed to call service ${service.name}: ${e.message}`);
            }
            return result;
        });
    }
    handlePostRequest(service) {
        return __awaiter(this, void 0, void 0, function* () {
            const trackId = service.payload.trackId;
            delete service.payload.trackId;
            const params = service.payload;
            const token = yield this.getValidToken(service.scope);
            let result;
            const config = {
                headers: { Authorization: `Bearer ${token}` },
                params: { trackId }
            };
            try {
                const { data } = yield axios_1.default.post(service.url, params, config);
                result = data;
            }
            catch (e) {
                throw new Error(`Failed to call service ${service.name}: ${e.message}`);
            }
            return result;
        });
    }
    getValidToken(scope) {
        return __awaiter(this, void 0, void 0, function* () {
            let token = yield ClientSDK.getTokenFromRedis(this.redisClient, scope);
            while (!token) {
                this.logger.info(`No token stored for this key [${scope}], getting a new one ..`);
                yield this.cacheToken(scope);
                token = yield ClientSDK.getTokenFromRedis(this.redisClient, scope);
            }
            return token;
        });
    }
}
exports.ClientSDK = ClientSDK;
