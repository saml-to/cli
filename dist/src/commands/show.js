"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Show = void 0;
const github_sls_rest_api_1 = require("../../api/github-sls-rest-api");
const scms_1 = require("../stores/scms");
class Show {
    scms;
    constructor() {
        this.scms = new scms_1.Scms();
    }
    async handle(subcommand, org) {
        switch (subcommand) {
            case 'config': {
                await this.showConfig(org);
                break;
            }
            case 'metadata': {
                await this.showMetadata(org);
                break;
            }
            case 'certificate': {
                await this.showCertificate(org);
                break;
            }
            default:
                throw new Error(`Unknown subcommand: ${subcommand}`);
        }
    }
    async fetchConfig(org) {
        const accessToken = this.scms.getGithubToken();
        const idpApi = new github_sls_rest_api_1.IDPApi(new github_sls_rest_api_1.Configuration({
            accessToken: accessToken,
        }));
        const { data: result } = await idpApi.getOrgConfig(org);
        return JSON.stringify(result, null, 2);
    }
    async showConfig(org) {
        const config = await this.fetchConfig(org);
        console.log(config);
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
    async showMetadata(org) {
        const metadataXml = await this.fetchMetadataXml(org);
        console.log(metadataXml);
    }
    async showCertificate(org) {
        const accessToken = this.scms.getGithubToken();
        const idpApi = new github_sls_rest_api_1.IDPApi(new github_sls_rest_api_1.Configuration({
            accessToken: accessToken,
        }));
        const { data: metadata } = await idpApi.getOrgMetadata(org);
        const { certificate } = metadata;
        console.log(certificate);
    }
}
exports.Show = Show;
//# sourceMappingURL=show.js.map