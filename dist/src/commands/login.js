"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Login = void 0;
const auth_sls_rest_api_1 = require("api/auth-sls-rest-api");
const axios_1 = __importDefault(require("axios"));
class Login {
    async handle() {
        console.log('A basic GitHub token with access to your identity will be generated.');
        const api = new auth_sls_rest_api_1.JwtGithubApi();
        const { data: oauthDetail } = await api.getOauthDetail();
        const { clientId: client_id } = oauthDetail;
        const { data: deviceCodeResponse } = await axios_1.default.post('https://github.com/login/device/code', {
            client_id,
            scope: 'user:email',
        });
        const { verification_uri: verificationUri, user_code: userCode } = deviceCodeResponse;
        console.log(`Open browser to ${verificationUri} and enter ${userCode}`);
    }
    getAccessToken(deviceCodeResponse) {
        return new Promise((resolve, reject) => {
        });
    }
}
exports.Login = Login;
//# sourceMappingURL=login.js.map