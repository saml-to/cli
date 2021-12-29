"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Login = void 0;
const github_sls_rest_api_1 = require("../../api/github-sls-rest-api");
const messages_1 = require("../messages");
const scms_1 = require("../stores/scms");
const axios_1 = __importDefault(require("axios"));
const open_1 = __importDefault(require("open"));
const show_1 = require("./show");
const awsHelper_1 = require("../helpers/aws/awsHelper");
const command_1 = require("../command");
const inquirer_1 = __importDefault(require("inquirer"));
class Login {
    scms;
    show;
    awsHelper;
    constructor() {
        this.scms = new scms_1.Scms();
        this.show = new show_1.Show();
        this.awsHelper = new awsHelper_1.AwsHelper();
    }
    async handle(provider, org) {
        if (!provider) {
            const choice = await this.promptLogin(org);
            provider = choice.provider;
            org = choice.org;
        }
        command_1.ui.updateBottomBar(`Logging into ${provider} (org: ${org})`);
        const token = this.scms.getGithubToken();
        if (!token) {
            throw new Error(messages_1.NO_GITHUB_CLIENT);
        }
        const idpApi = new github_sls_rest_api_1.IDPApi(new github_sls_rest_api_1.Configuration({
            accessToken: token,
        }));
        try {
            const { data: response } = await idpApi.providerLogin(provider, org);
            await this.assumeBrowser(response);
        }
        catch (e) {
            if (axios_1.default.isAxiosError(e) && e.response) {
                if (e.response.status === 403) {
                    throw new Error((0, messages_1.ERROR_LOGGING_IN)(provider, `Reason: ${e.response.data.message}`));
                }
                else if (e.response.status === 404) {
                    throw new Error((0, messages_1.MULTIPLE_LOGINS)(provider, `Reason: ${e.response.data.message}`));
                }
                else {
                    throw e;
                }
            }
            throw e;
        }
        return;
    }
    async assumeBrowser(samlResponse) {
        if (samlResponse.browserUri) {
            await (0, open_1.default)(samlResponse.browserUri);
        }
        else {
            throw new Error(`Browser URI is not set.`);
        }
    }
    async promptLogin(org) {
        const logins = await this.show.fetchLogins(org);
        command_1.ui.updateBottomBar('');
        const { loginIx } = await inquirer_1.default.prompt({
            type: 'list',
            name: 'loginIx',
            message: `For which provider would you like to log in?`,
            choices: logins.map((l, ix) => {
                return { name: `${l.provider} (${l.org})`, value: ix };
            }),
        });
        return logins[loginIx];
    }
}
exports.Login = Login;
//# sourceMappingURL=login.js.map