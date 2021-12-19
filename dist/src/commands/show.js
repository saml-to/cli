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
const js_yaml_1 = require("js-yaml");
class Show {
    scms;
    constructor() {
        this.scms = new scms_1.Scms();
    }
    async handle(subcommand, org, save, refresh, raw) {
        switch (subcommand) {
            case 'orgs': {
                await this.showOrgs(save);
                return;
            }
            case 'roles': {
                await this.showRoles(org, refresh, save);
                return;
            }
            case 'logins': {
                throw new Error('Not supported yet');
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
            default:
                break;
        }
        throw new Error(`Unknown subcommand: ${subcommand}`);
    }
    async fetchConfigYaml(org, raw = false) {
        const accessToken = this.scms.getGithubToken();
        const idpApi = new github_sls_rest_api_1.IDPApi(new github_sls_rest_api_1.Configuration({
            accessToken: accessToken,
        }));
        const { data: result } = await idpApi.getOrgConfig(org, raw);
        return `---
${(0, js_yaml_1.dump)(result)}`;
    }
    async showConfig(org, save, raw) {
        const config = await this.fetchConfigYaml(org, raw);
        if (!save) {
            console.log(config);
        }
        else {
            const location = path_1.default.join(scms_1.CONFIG_DIR, `${org}-config.yaml`);
            fs_1.default.writeFileSync(location, config);
            command_1.ui.updateBottomBar('');
            console.log(`Config saved to ${location}`);
        }
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
            console.log(certificate);
        }
        else {
            const location = path_1.default.join(scms_1.CONFIG_DIR, `${org}-certificate.pem`);
            fs_1.default.writeFileSync(location, certificate);
            command_1.ui.updateBottomBar('');
            console.log(`Certificate saved to ${location}`);
        }
    }
    async fetchOrgs() {
        const accessToken = this.scms.getGithubToken();
        const idpApi = new github_sls_rest_api_1.IDPApi(new github_sls_rest_api_1.Configuration({
            accessToken: accessToken,
        }));
        const { data: orgs } = await idpApi.listOrgRepos();
        return orgs.results;
    }
    async showOrgs(save) {
        const orgs = await this.fetchOrgs();
        if (!save) {
            command_1.ui.updateBottomBar('');
            if (!orgs.length) {
                console.log(`No orgs`); // TODO Better messaging
            }
            console.table(orgs, ['org']);
        }
        else {
            const location = path_1.default.join(scms_1.CONFIG_DIR, `orgs.json`);
            fs_1.default.writeFileSync(location, JSON.stringify(orgs));
            command_1.ui.updateBottomBar('');
            console.log(`Orgs saved to ${location}`);
        }
    }
    async fetchRoles(org, refresh) {
        const accessToken = this.scms.getGithubToken();
        const idpApi = new github_sls_rest_api_1.IDPApi(new github_sls_rest_api_1.Configuration({
            accessToken: accessToken,
        }));
        const { data: roles } = await idpApi.listRoles(org, refresh);
        return roles.results;
    }
    async showRoles(org, refresh, save) {
        const roles = await this.fetchRoles(org, refresh);
        if (!save) {
            command_1.ui.updateBottomBar('');
            if (!roles.length) {
                console.log(`No roles in ${org}`);
            }
            console.table(roles, ['org', 'provider', 'role']);
        }
        else {
            const location = path_1.default.join(scms_1.CONFIG_DIR, `${org}-roles.json`);
            fs_1.default.writeFileSync(location, JSON.stringify(roles));
            command_1.ui.updateBottomBar('');
            console.log(`Roles saved to ${location}`);
        }
    }
}
exports.Show = Show;
//# sourceMappingURL=show.js.map