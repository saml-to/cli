import { NO_ORG } from '../messages';
import {
  IDPApi,
  Configuration,
  GithubSlsRestApiRoleResponse,
  GithubSlsRestApiLoginResponse,
} from '../../api/github-sls-rest-api';
import { CONFIG_DIR, Scms } from '../stores/scms';
import fs from 'fs';
import path from 'path';
import { ui } from '../command';
import { ConfigHelper } from '../helpers/configHelper';
import { OrgHelper } from '../helpers/orgHelper';

export type ShowSubcommands =
  | 'metadata'
  | 'certificate'
  | 'entityId'
  | 'loginUrl'
  | 'logoutUrl'
  | 'roles'
  | 'logins'
  | 'orgs'
  | 'config';

export class Show {
  scms: Scms;

  configHelper: ConfigHelper;

  orgHelper: OrgHelper;

  constructor() {
    this.scms = new Scms();

    this.configHelper = new ConfigHelper();

    this.orgHelper = new OrgHelper();
  }

  public async handle(
    subcommand: ShowSubcommands,
    org?: string,
    provider?: string,
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

  private async showConfig(org: string, save?: boolean, raw?: boolean): Promise<void> {
    const config = await this.configHelper.fetchConfigYaml(org, raw);
    if (!save) {
      ui.updateBottomBar('');
      console.log(config);
    } else {
      const location = path.join(CONFIG_DIR, `${org}-config.yaml`);
      fs.writeFileSync(location, config);
      ui.updateBottomBar('');
      console.log(`Config saved to ${location}`);
    }
  }

  public async fetchEntityId(org: string): Promise<string> {
    const accessToken = this.scms.getGithubToken();
    const idpApi = new IDPApi(
      new Configuration({
        accessToken: accessToken,
      }),
    );
    const { data: metadata } = await idpApi.getOrgMetadata(org);
    const { entityId } = metadata;
    return entityId;
  }

  public async fetchLoginUrl(org: string): Promise<string> {
    const accessToken = this.scms.getGithubToken();
    const idpApi = new IDPApi(
      new Configuration({
        accessToken: accessToken,
      }),
    );
    const { data: metadata } = await idpApi.getOrgMetadata(org);
    const { loginUrl } = metadata;
    return loginUrl;
  }

  public async fetchLogoutUrl(org: string): Promise<string> {
    const accessToken = this.scms.getGithubToken();
    const idpApi = new IDPApi(
      new Configuration({
        accessToken: accessToken,
      }),
    );
    const { data: metadata } = await idpApi.getOrgMetadata(org);
    const { logoutUrl } = metadata;
    return logoutUrl;
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
      ui.updateBottomBar('');
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
      ui.updateBottomBar('');
      console.log(certificate);
    } else {
      const location = path.join(CONFIG_DIR, `${org}-certificate.pem`);
      fs.writeFileSync(location, certificate);
      ui.updateBottomBar('');
      console.log(`Certificate saved to ${location}`);
    }
  }

  private async showOrgs(save?: boolean): Promise<void> {
    const orgs = await this.orgHelper.fetchOrgs();

    if (!save) {
      ui.updateBottomBar('');
      if (!orgs.length) {
        console.log(`No orgs`); // TODO Better messaging
      }
      console.table(orgs, ['org']);
    } else {
      const location = path.join(CONFIG_DIR, `orgs.json`);
      fs.writeFileSync(location, JSON.stringify({ orgs }));
      ui.updateBottomBar('');
      console.log(`Orgs saved to ${location}`);
    }
  }

  public async fetchRoles(
    org?: string,
    provider?: string,
    refresh?: boolean,
  ): Promise<GithubSlsRestApiRoleResponse[]> {
    const accessToken = this.scms.getGithubToken();
    const idpApi = new IDPApi(
      new Configuration({
        accessToken: accessToken,
      }),
    );
    const { data: roles } = await idpApi.listRoles(org, provider, refresh);
    return roles.results;
  }

  private async showRoles(
    org?: string,
    provider?: string,
    refresh?: boolean,
    save?: boolean,
  ): Promise<void> {
    const roles = await this.fetchRoles(org, provider, refresh);

    if (!save) {
      ui.updateBottomBar('');
      if (!roles.length) {
        throw new Error('No roles are available to assume');
      }
      console.table(roles, ['role', 'provider', 'org']);
    } else {
      const location = path.join(CONFIG_DIR, `roles.json`);
      fs.writeFileSync(location, JSON.stringify({ roles }));
      ui.updateBottomBar('');
      console.log(`Roles saved to ${location}`);
    }
  }

  public async fetchLogins(
    org?: string,
    refresh?: boolean,
  ): Promise<GithubSlsRestApiLoginResponse[]> {
    const accessToken = this.scms.getGithubToken();
    const idpApi = new IDPApi(
      new Configuration({
        accessToken: accessToken,
      }),
    );
    const { data: logins } = await idpApi.listLogins(org, refresh);
    return logins.results;
  }

  private async showLogins(org?: string, refresh?: boolean, save?: boolean): Promise<void> {
    const logins = await this.fetchLogins(org, refresh);

    if (!save) {
      ui.updateBottomBar('');
      if (!logins.length) {
        throw new Error('No providers are available to login');
      }
      console.table(logins, ['provider', 'org']);
    } else {
      const location = path.join(CONFIG_DIR, `logins.json`);
      fs.writeFileSync(location, JSON.stringify({ logins }));
      ui.updateBottomBar('');
      console.log(`Logins saved to ${location}`);
    }
  }

  private async showEntityId(org: string, save?: boolean): Promise<void> {
    const entityId = await this.fetchEntityId(org);
    if (!save) {
      ui.updateBottomBar('');
      console.log(entityId);
    } else {
      const location = path.join(CONFIG_DIR, `${org}-entityId.json`);
      fs.writeFileSync(location, JSON.stringify({ entityId }));
      ui.updateBottomBar('');
      console.log(`Entity ID saved to ${location}`);
    }
  }

  private async showLoginUrl(org: string, save?: boolean): Promise<void> {
    const loginUrl = await this.fetchLoginUrl(org);
    if (!save) {
      ui.updateBottomBar('');
      console.log(loginUrl);
    } else {
      const location = path.join(CONFIG_DIR, `${org}-loginUrl.json`);
      fs.writeFileSync(location, JSON.stringify({ loginUrl }));
      ui.updateBottomBar('');
      console.log(`Entity ID saved to ${location}`);
    }
  }

  private async showLogoutUrl(org: string, save?: boolean): Promise<void> {
    const logoutUrl = await this.fetchLogoutUrl(org);
    if (!save) {
      ui.updateBottomBar('');
      console.log(logoutUrl);
    } else {
      const location = path.join(CONFIG_DIR, `${org}-logoutUrl.json`);
      fs.writeFileSync(location, JSON.stringify({ logoutUrl }));
      ui.updateBottomBar('');
      console.log(`Entity ID saved to ${location}`);
    }
  }
}
