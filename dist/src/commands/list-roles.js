"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListRoles = void 0;
const scms_1 = require("../stores/scms");
const github_sls_rest_api_1 = require("../../api/github-sls-rest-api");
const messages_1 = require("../messages");
class ListRoles {
    scms;
    constructor() {
        this.scms = new scms_1.Scms();
    }
    async handle() {
        const accessToken = this.scms.getGithubToken();
        if (!accessToken) {
            throw new Error(messages_1.NOT_LOGGED_IN);
        }
        const idpApi = new github_sls_rest_api_1.IDPApi(new github_sls_rest_api_1.Configuration({
            accessToken: accessToken,
        }));
        const { data: roles } = await idpApi.listRoles();
        roles.results.forEach((role) => {
            console.log(`${role.role} [Provider: ${role.provider}] (Org: ${role.org})`);
        });
    }
}
exports.ListRoles = ListRoles;
//# sourceMappingURL=list-roles.js.map