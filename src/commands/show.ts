import { NO_ORG } from '../messages';
import {
  IDPApi,
  Configuration,
  GithubSlsRestApiRoleResponse,
  GithubSlsRestApiOrgRepoResponse,
} from '../../api/github-sls-rest-api';
import { CONFIG_DIR, Scms } from '../stores/scms';
import fs from 'fs';
import path from 'path';
import { ui } from '../command';
import { dump } from 'js-yaml';

export type ShowSubcommands = 'metadata' | 'certificate' | 'roles' | 'logins' | 'orgs' | 'config';

export class Show {
  scms: Scms;

  constructor() {
    this.scms = new Scms();
  }

  public async handle(
    subcommand: ShowSubcommands,
    org?: string,
    save?: boolean,
    refresh?: boolean,
    raw?: boolean,
  ): Promise<void> {
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
        throw new Error(NO_ORG);
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

  public async fetchConfigYaml(org: string, raw = false): Promise<string> {
    const accessToken = this.scms.getGithubToken();
    const idpApi = new IDPApi(
      new Configuration({
        accessToken: accessToken,
      }),
    );
    const { data: result } = await idpApi.getOrgConfig(org, raw);
    return `---
${dump(result)}`;
  }

  private async showConfig(org: string, save?: boolean, raw?: boolean): Promise<void> {
    const config = await this.fetchConfigYaml(org, raw);
    if (!save) {
      console.log(config);
    } else {
      const location = path.join(CONFIG_DIR, `${org}-config.yaml`);
      fs.writeFileSync(location, config);
      ui.updateBottomBar('');
      console.log(`Config saved to ${location}`);
    }
  }

  public async fetchMetadataXml(org: string): Promise<string> {
    const accessToken = this.scms.getGithubToken();
    const idpApi = new IDPApi(
      new Configuration({
        accessToken: accessToken,
      }),
    );
    const { data: metadata } = await idpApi.getOrgMetadata(org);
    const { metadataXml } = metadata;
    return metadataXml;
  }

  private async showMetadata(org: string, save?: boolean): Promise<void> {
    const metadataXml = await this.fetchMetadataXml(org);
    if (!save) {
      console.log(metadataXml);
    } else {
      const location = path.join(CONFIG_DIR, `${org}-metadata.xml`);
      fs.writeFileSync(location, metadataXml);
      ui.updateBottomBar('');
      console.log(`Metadata saved to ${location}`);
    }
  }

  private async showCertificate(org: string, save?: boolean): Promise<void> {
    const accessToken = this.scms.getGithubToken();
    const idpApi = new IDPApi(
      new Configuration({
        accessToken: accessToken,
      }),
    );
    const { data: metadata } = await idpApi.getOrgMetadata(org);
    const { certificate } = metadata;

    if (!save) {
      console.log(certificate);
    } else {
      const location = path.join(CONFIG_DIR, `${org}-certificate.pem`);
      fs.writeFileSync(location, certificate);
      ui.updateBottomBar('');
      console.log(`Certificate saved to ${location}`);
    }
  }

  public async fetchOrgs(): Promise<GithubSlsRestApiOrgRepoResponse[]> {
    const accessToken = this.scms.getGithubToken();
    const idpApi = new IDPApi(
      new Configuration({
        accessToken: accessToken,
      }),
    );
    const { data: orgs } = await idpApi.listOrgRepos();
    return orgs.results;
  }

  private async showOrgs(save?: boolean): Promise<void> {
    const orgs = await this.fetchOrgs();

    if (!save) {
      ui.updateBottomBar('');
      if (!orgs.length) {
        console.log(`No orgs`); // TODO Better messaging
      }
      console.table(orgs, ['org']);
    } else {
      const location = path.join(CONFIG_DIR, `orgs.json`);
      fs.writeFileSync(location, JSON.stringify(orgs));
      ui.updateBottomBar('');
      console.log(`Orgs saved to ${location}`);
    }
  }

  public async fetchRoles(
    org?: string,
    refresh?: boolean,
  ): Promise<GithubSlsRestApiRoleResponse[]> {
    const accessToken = this.scms.getGithubToken();
    const idpApi = new IDPApi(
      new Configuration({
        accessToken: accessToken,
      }),
    );
    const { data: roles } = await idpApi.listRoles(org, refresh);
    return roles.results;
  }

  private async showRoles(org?: string, refresh?: boolean, save?: boolean): Promise<void> {
    const roles = await this.fetchRoles(org, refresh);

    if (!save) {
      ui.updateBottomBar('');
      if (!roles.length) {
        console.log(`No roles in ${org}`);
      }
      console.table(roles, ['org', 'provider', 'role']);
    } else {
      const location = path.join(CONFIG_DIR, `${org}-roles.json`);
      fs.writeFileSync(location, JSON.stringify(roles));
      ui.updateBottomBar('');
      console.log(`Roles saved to ${location}`);
    }
  }
}
