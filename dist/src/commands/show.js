"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Show = void 0;
const messages_1 = require("../messages");
const github_sls_rest_api_1 = require("../../api/github-sls-rest-api");
const scms_1 = require("../stores/scms");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const command_1 = require("../command");
const configHelper_1 = require("../helpers/configHelper");
const orgHelper_1 = require("../helpers/orgHelper");
class Show {
    scms;
    configHelper;
    orgHelper;
    constructor() {
        this.scms = new scms_1.Scms();
        this.configHelper = new configHelper_1.ConfigHelper();
        this.orgHelper = new orgHelper_1.OrgHelper();
    }
    async handle(subcommand, org, provider, save, refresh, raw) {
        switch (subcommand) {
            case 'orgs': {
                await this.showOrgs(save);
                return;
            }
            case 'roles': {
                await this.showRoles(org, provider, refresh, save);
                return;
            }
            case 'logins': {
                await this.showLogins(org, refresh, save);
                return;
            }
            default:
                break;
        }
        if (!org) {
            org = this.scms.getOrg();
            if (!org) {
                throw new Error(messages_1.NO_ORG);
            }
        }
        switch (subcommand) {
            case 'metadata': {
                return this.showMetadata(org, save);
            }
            case 'certificate': {
                return this.showCertificate(org, save);
            }
            case 'config': {
                return this.showConfig(org, save, raw);
            }
            case 'entityId': {
                return this.showEntityId(org, save);
            }
            case 'loginUrl': {
                return this.showLoginUrl(org, save);
            }
            case 'logoutUrl': {
                return this.showLogoutUrl(org, save);
            }
            default:
                break;
        }
        throw new Error(`Unknown subcommand: ${subcommand}`);
    }
    async showConfig(org, save, raw) {
        const config = await this.configHelper.fetchConfigYaml(org, raw);
        if (!save) {
            command_1.ui.updateBottomBar('');
            console.log(config);
        }
        else {
            const location = path_1.default.join(scms_1.CONFIG_DIR, `${org}-config.yaml`);
            fs_1.default.writeFileSync(location, config);
            command_1.ui.updateBottomBar('');
            console.log(`Config saved to ${location}`);
        }
    }
    async fetchEntityId(org) {
        const accessToken = this.scms.getGithubToken();
        const idpApi = new github_sls_rest_api_1.IDPApi(new github_sls_rest_api_1.Configuration({
            accessToken: accessToken,
        }));
        const { data: metadata } = await idpApi.getOrgMetadata(org);
        const { entityId } = metadata;
        return entityId;
    }
    async fetchLoginUrl(org) {
        const accessToken = this.scms.getGithubToken();
        const idpApi = new github_sls_rest_api_1.IDPApi(new github_sls_rest_api_1.Configuration({
            accessToken: accessToken,
        }));
        const { data: metadata } = await idpApi.getOrgMetadata(org);
        const { loginUrl } = metadata;
        return loginUrl;
    }
    async fetchLogoutUrl(org) {
        const accessToken = this.scms.getGithubToken();
        const idpApi = new github_sls_rest_api_1.IDPApi(new github_sls_rest_api_1.Configuration({
            accessToken: accessToken,
        }));
        const { data: metadata } = await idpApi.getOrgMetadata(org);
        const { logoutUrl } = metadata;
        return logoutUrl;
    }
    async fetchMetadataXml(org) {
        const accessToken = this.scms.getGithubToken();
        const idpApi = new github_sls_rest_api_1.IDPApi(new github_sls_rest_api_1.Configuration({
            accessToken: accessToken,
        }));
        const { data: metadata } = await idpApi.getOrgMetadata(org);
        const { metadataXml } = metadata;
        return metadataXml;
    }
    async showMetadata(org, save) {
        const metadataXml = await this.fetchMetadataXml(org);
        if (!save) {
            command_1.ui.updateBottomBar('');
            console.log(metadataXml);
        }
        else {
            const location = path_1.default.join(scms_1.CONFIG_DIR, `${org}-metadata.xml`);
            fs_1.default.writeFileSync(location, metadataXml);
            command_1.ui.updateBottomBar('');
            console.log(`Metadata saved to ${location}`);
        }
    }
    async showCertificate(org, save) {
        const accessToken = this.scms.getGithubToken();
        const idpApi = new github_sls_rest_api_1.IDPApi(new github_sls_rest_api_1.Configuration({
            accessToken: accessToken,
        }));
        const { data: metadata } = await idpApi.getOrgMetadata(org);
        const { certificate } = metadata;
        if (!save) {
            command_1.ui.updateBottomBar('');
            console.log(certificate);
        }
        else {
            const location = path_1.default.join(scms_1.CONFIG_DIR, `${org}-certificate.pem`);
            fs_1.default.writeFileSync(location, certificate);
            command_1.ui.updateBottomBar('');
            console.log(`Certificate saved to ${location}`);
        }
    }
    async showOrgs(save) {
        const orgs = await this.orgHelper.fetchOrgs();
        if (!save) {
            command_1.ui.updateBottomBar('');
            if (!orgs.length) {
                console.log(`No orgs`); // TODO Better messaging
            }
            console.table(orgs, ['org']);
        }
        else {
            const location = path_1.default.join(scms_1.CONFIG_DIR, `orgs.json`);
            fs_1.default.writeFileSync(location, JSON.stringify({ orgs }));
            command_1.ui.updateBottomBar('');
            console.log(`Orgs saved to ${location}`);
        }
    }
    async fetchRoles(org, provider, refresh) {
        const accessToken = this.scms.getGithubToken();
        const idpApi = new github_sls_rest_api_1.IDPApi(new github_sls_rest_api_1.Configuration({
            accessToken: accessToken,
        }));
        const { data: roles } = await idpApi.listRoles(org, provider, refresh);
        return roles.results;
    }
    async showRoles(org, provider, refresh, save) {
        const roles = await this.fetchRoles(org, provider, refresh);
        if (!save) {
            command_1.ui.updateBottomBar('');
            if (!roles.length) {
                throw new Error('No roles are available to assume');
            }
            console.table(roles, ['role', 'provider', 'org']);
        }
        else {
            const location = path_1.default.join(scms_1.CONFIG_DIR, `roles.json`);
            fs_1.default.writeFileSync(location, JSON.stringify({ roles }));
            command_1.ui.updateBottomBar('');
            console.log(`Roles saved to ${location}`);
        }
    }
    async fetchLogins(org, refresh) {
        const accessToken = this.scms.getGithubToken();
        const idpApi = new github_sls_rest_api_1.IDPApi(new github_sls_rest_api_1.Configuration({
            accessToken: accessToken,
        }));
        const { data: logins } = await idpApi.listLogins(org, refresh);
        return logins.results;
    }
    async showLogins(org, refresh, save) {
        const logins = await this.fetchLogins(org, refresh);
        if (!save) {
            command_1.ui.updateBottomBar('');
            if (!logins.length) {
                throw new Error('No providers are available to login');
            }
            console.table(logins, ['provider', 'org']);
        }
        else {
            const location = path_1.default.join(scms_1.CONFIG_DIR, `logins.json`);
            fs_1.default.writeFileSync(location, JSON.stringify({ logins }));
            command_1.ui.updateBottomBar('');
            console.log(`Logins saved to ${location}`);
        }
    }
    async showEntityId(org, save) {
        const entityId = await this.fetchEntityId(org);
        if (!save) {
            command_1.ui.updateBottomBar('');
            console.log(entityId);
        }
        else {
            const location = path_1.default.join(scms_1.CONFIG_DIR, `${org}-entityId.json`);
            fs_1.default.writeFileSync(location, JSON.stringify({ entityId }));
            command_1.ui.updateBottomBar('');
            console.log(`Entity ID saved to ${location}`);
        }
    }
    async showLoginUrl(org, save) {
        const loginUrl = await this.fetchLoginUrl(org);
        if (!save) {
            command_1.ui.updateBottomBar('');
            console.log(loginUrl);
        }
        else {
            const location = path_1.default.join(scms_1.CONFIG_DIR, `${org}-loginUrl.json`);
            fs_1.default.writeFileSync(location, JSON.stringify({ loginUrl }));
            command_1.ui.updateBottomBar('');
            console.log(`Entity ID saved to ${location}`);
        }
    }
    async showLogoutUrl(org, save) {
        const logoutUrl = await this.fetchLogoutUrl(org);
        if (!save) {
            command_1.ui.updateBottomBar('');
            console.log(logoutUrl);
        }
        else {
            const location = path_1.default.join(scms_1.CONFIG_DIR, `${org}-logoutUrl.json`);
            fs_1.default.writeFileSync(location, JSON.stringify({ logoutUrl }));
            command_1.ui.updateBottomBar('');
            console.log(`Entity ID saved to ${location}`);
        }
    }
}
exports.Show = Show;
//# sourceMappingURL=show.js.map