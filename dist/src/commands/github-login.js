"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GithubLogin = void 0;
const auth_sls_rest_api_1 = require("../../api/auth-sls-rest-api");
const axios_1 = __importDefault(require("axios"));
const moment_1 = __importDefault(require("moment"));
const scms_1 = require("../stores/scms");
class GithubLogin {
    scms;
    constructor() {
        this.scms = new scms_1.Scms();
    }
    async handle(scope = 'user:email') {
        const api = new auth_sls_rest_api_1.JwtGithubApi();
        const { data: oauthDetail } = await api.getOauthDetail();
        const { clientId } = oauthDetail;
        const response = await axios_1.default.post('https://github.com/login/device/code', {
            client_id: clientId,
            scope,
        }, { headers: { Accept: 'application/json' } });
        const { verification_uri: verificationUri, user_code: userCode } = response.data;
        console.log(`Please open the browser to ${verificationUri}, and enter the code:`);
        console.log(`\n${userCode}\n`);
        const accessTokenResponse = await this.getAccessToken(clientId, response.data, (0, moment_1.default)().add(response.data.expires_in, 'second'));
        const location = this.scms.saveGithubToken(accessTokenResponse.access_token);
        console.log(`Saved GitHub credentials to ${location}`);
    }
    getAccessToken(clientId, deviceCodeResponse, tryUntil) {
        return new Promise((resolve, reject) => {
            const now = (0, moment_1.default)();
            if (now.isSameOrAfter(tryUntil)) {
                reject(new Error('Access token request has expired. Please re-run the `login` command'));
                return;
            }
            axios_1.default
                .post('https://github.com/login/oauth/access_token', {
                client_id: clientId,
                device_code: deviceCodeResponse.device_code,
                grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
            }, { headers: { Accept: 'application/json' } })
                .then(({ data: accessTokenResponse }) => {
                if (accessTokenResponse.error) {
                    if (accessTokenResponse.error === 'authorization_pending') {
                        setTimeout(() => this.getAccessToken(clientId, deviceCodeResponse, tryUntil)
                            .then((response) => resolve(response))
                            .catch((error) => reject(error)), deviceCodeResponse.interval * 1000);
                        return;
                    }
                    reject(new Error(accessTokenResponse.error_description));
                    return;
                }
                resolve(accessTokenResponse);
            })
                .catch((error) => reject(error));
        });
    }
}
exports.GithubLogin = GithubLogin;
//# sourceMappingURL=github-login.js.map