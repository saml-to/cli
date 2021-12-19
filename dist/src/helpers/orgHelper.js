"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrgHelper = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const command_1 = require("../command");
const github_sls_rest_api_1 = require("../../api/github-sls-rest-api");
const scms_1 = require("../stores/scms");
class OrgHelper {
    scms;
    constructor() {
        this.scms = new scms_1.Scms();
    }
    async fetchOrgs() {
        const accessToken = this.scms.getGithubToken();
        const idpApi = new github_sls_rest_api_1.IDPApi(new github_sls_rest_api_1.Configuration({
            accessToken: accessToken,
        }));
        const { data: orgs } = await idpApi.listOrgRepos();
        return orgs.results;
    }
    async promptOrg(operation) {
        const orgs = await this.fetchOrgs();
        if (!orgs.length) {
            throw new Error(`Please run the \`init\` command first`);
        }
        if (orgs.length === 1) {
            return orgs[0];
        }
        command_1.ui.updateBottomBar('');
        const { orgIx } = await inquirer_1.default.prompt({
            type: 'list',
            name: 'orgIx',
            message: `For which organization would you like to ${operation}?`,
            choices: orgs.map((o, ix) => {
                return { name: `${o.org} (${o.repo})`, value: ix };
            }),
        });
        const org = this.scms.getOrg();
        if (!org) {
            this.scms.saveGithubOrg(orgs[orgIx].org);
        }
        return orgs[orgIx];
    }
}
exports.OrgHelper = OrgHelper;
//# sourceMappingURL=orgHelper.js.map