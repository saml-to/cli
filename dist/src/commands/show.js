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
    async showConfig(org, save, raw) {
        const config = await this.configHelper.fetchConfigYaml(org, raw);
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