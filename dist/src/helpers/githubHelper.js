"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GithubHelper = void 0;
const auth_sls_rest_api_1 = require("../../api/auth-sls-rest-api");
const axios_1 = __importDefault(require("axios"));
const moment_1 = __importDefault(require("moment"));
const scms_1 = require("../stores/scms");
const loglevel_1 = __importDefault(require("loglevel"));
const messages_1 = require("../messages");
const command_1 = require("../command");
const rest_1 = require("@octokit/rest");
class GithubHelper {
    scms;
    constructor() {
        this.scms = new scms_1.Scms();
    }
    async promptLogin(scope = 'user:email', org) {
        const api = new auth_sls_rest_api_1.JwtGithubApi();
        const { data: oauthDetail } = await api.getOauthDetail();
        const { clientId } = oauthDetail;
        const response = await axios_1.default.post('https://github.com/login/device/code', {
            client_id: clientId,
            scope,
        }, { headers: { Accept: 'application/json' } });
        const { verification_uri: verificationUri, user_code: userCode } = response.data;
        command_1.ui.updateBottomBar('');
        console.log(`
To continue, access to your GitHub profile (with scope \`${scope}\`) is needed...

Please open the browser to ${verificationUri}, and enter the code:

${userCode}
`);
        const accessTokenResponse = await this.getAccessToken(clientId, response.data, (0, moment_1.default)().add(response.data.expires_in, 'second'));
        const octokit = new rest_1.Octokit({ auth: accessTokenResponse.access_token });
        const { data: user } = await octokit.users.getAuthenticated();
        if (org && user.login !== org) {
            const orgs = await octokit.paginate(octokit.orgs.listForAuthenticatedUser);
            const found = orgs.find((o) => o.login === org);
            if (!found) {
                command_1.ui.updateBottomBar('');
                console.warn(`It appears access to ${org} has not beeen granted, let's try again...`);
                return this.promptLogin(scope, org);
            }
        }
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
    async assertScope(scope, org) {
        command_1.ui.updateBottomBar('Checking scopes...');
        let github;
        try {
            const clients = await this.scms.loadClients();
            github = clients.github;
        }
        catch (e) {
            if (e instanceof scms_1.NoTokenError) {
                await this.promptLogin(scope, org);
                return this.assertScope(scope, org);
            }
            throw e;
        }
        if (!github) {
            throw new Error(`Unable to load GitHub client`);
        }
        const { headers } = await github.users.getAuthenticated();
        try {
            this.assertScopes(headers, scope);
        }
        catch (e) {
            if (e instanceof Error) {
                loglevel_1.default.debug(e.message);
                command_1.ui.updateBottomBar('');
                console.log((0, messages_1.GITHUB_SCOPE_NEEDED)(scope));
                await this.promptLogin(scope, org);
                return this.assertScope(scope, org);
            }
            throw e;
        }
    }
    assertScopes(headers, expectedScope) {
        const xOauthScopes = headers['x-oauth-scopes'];
        loglevel_1.default.debug('Current scopes:', xOauthScopes);
        const scopes = xOauthScopes.split(' ');
        if (scopes.includes(expectedScope)) {
            return;
        }
        throw new Error(`Missing scope. Expected:${expectedScope} Actual:${scopes}`);
    }
}
exports.GithubHelper = GithubHelper;
//# sourceMappingURL=githubHelper.js.map