"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Assume = void 0;
const github_sls_rest_api_1 = require("../../api/github-sls-rest-api");
const messages_1 = require("../messages");
const scms_1 = require("../stores/scms");
const axios_1 = __importDefault(require("axios"));
const loglevel_1 = __importDefault(require("loglevel"));
const open_1 = __importDefault(require("open"));
const show_1 = require("./show");
const inquirer_1 = __importDefault(require("inquirer"));
const command_1 = require("../command");
const awsHelper_1 = require("../helpers/aws/awsHelper");
class Assume {
    scms;
    show;
    awsHelper;
    constructor() {
        this.scms = new scms_1.Scms();
        this.show = new show_1.Show();
        this.awsHelper = new awsHelper_1.AwsHelper();
    }
    async handle(role, headless = false, org, provider) {
        loglevel_1.default.debug(`Assuming ${role} (headless: ${headless} org: ${org} provider: ${provider})`);
        const token = this.scms.getGithubToken();
        if (!token) {
            throw new Error(messages_1.NO_GITHUB_CLIENT);
        }
        if (!role && !headless) {
            const roles = await this.show.fetchRoles(org);
            if (!roles.length) {
                throw new Error(`No roles are available to assume`);
            }
            command_1.ui.updateBottomBar('');
            const { roleIx } = await inquirer_1.default.prompt({
                type: 'list',
                name: 'roleIx',
                message: `What role would you like to assume?`,
                choices: roles.map((r, ix) => {
                    return { name: `${r.role} [${r.provider}@${r.org}]`, value: ix };
                }),
            });
            role = roles[roleIx].role;
            org = roles[roleIx].org;
            provider = roles[roleIx].provider;
        }
        if (!role) {
            throw new Error(`Please specify a role to assume`);
        }
        const idpApi = new github_sls_rest_api_1.IDPApi(new github_sls_rest_api_1.Configuration({
            accessToken: token,
        }));
        try {
            const { data: response } = await idpApi.assumeRole(role, org, provider);
            if (headless) {
                await this.assumeTerminal(response);
            }
            else {
                await this.assumeBrowser(response);
            }
        }
        catch (e) {
            if (axios_1.default.isAxiosError(e) && e.response) {
                if (e.response.status === 403) {
                    throw new Error((0, messages_1.ERROR_ASSUMING_ROLE)(role, `Reason: ${e.response.data.message}`));
                }
                else if (e.response.status === 404) {
                    throw new Error((0, messages_1.MULTIPLE_ROLES)(role, `Reason: ${e.response.data.message}`));
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
            loglevel_1.default.debug('Opening browser to:', samlResponse.browserUri);
            await (0, open_1.default)(samlResponse.browserUri);
        }
        else {
            throw new Error(`Browser URI is not set.`);
        }
    }
    async assumeTerminal(samlResponse) {
        if (samlResponse.recipient.endsWith('.amazon.com/saml')) {
            return this.awsHelper.assumeAws(samlResponse);
        }
        throw new Error((0, messages_1.TERMINAL_NOT_SUPPORTED)(samlResponse.provider, samlResponse.recipient));
    }
}
exports.Assume = Assume;
//# sourceMappingURL=assume.js.map