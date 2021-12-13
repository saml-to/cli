import { IDPApi, Configuration } from '../../api/github-sls-rest-api';
import { Scms } from '../stores/scms';

export type ShowSubcommands = 'config' | 'metadata' | 'certificate';

export class Show {
  scms: Scms;

  constructor() {
    this.scms = new Scms();
  }

  public async handle(subcommand: ShowSubcommands, org: string): Promise<void> {
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

  public async fetchConfig(org: string): Promise<string> {
    const accessToken = this.scms.getGithubToken();
    const idpApi = new IDPApi(
      new Configuration({
        accessToken: accessToken,
      }),
    );
    const { data: result } = await idpApi.getOrgConfig(org);
    return JSON.stringify(result, null, 2);
  }

  private async showConfig(org: string): Promise<void> {
    const config = await this.fetchConfig(org);
    console.log(config);
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

  private async showMetadata(org: string): Promise<void> {
    const metadataXml = await this.fetchMetadataXml(org);
    console.log(metadataXml);
  }

  private async showCertificate(org: string): Promise<void> {
    const accessToken = this.scms.getGithubToken();
    const idpApi = new IDPApi(
      new Configuration({
        accessToken: accessToken,
      }),
    );
    const { data: metadata } = await idpApi.getOrgMetadata(org);
    const { certificate } = metadata;
    console.log(certificate);
  }
}
