import { dump } from 'js-yaml';
import { NO_GITHUB_CLIENT } from '../messages';
import { Scms } from '../stores/scms';
import { prompt, ui } from '../command';
import { CONFIG_FILE } from '../commands/init';
import { event } from './events';
import { ApiHelper } from './apiHelper';

export class ConfigHelper {
  scms: Scms;

  constructor(private apiHelper: ApiHelper) {
    this.scms = new Scms();
  }

  public async fetchConfigYaml(org: string, raw = false): Promise<string> {
    ui.updateBottomBar('Fetching config...');
    const accessToken = this.scms.getGithubToken();
    const idpApi = this.apiHelper.idpApi(accessToken);
    const { data: result } = await idpApi.getOrgConfig(org, raw);
    return `---
${dump(result, { lineWidth: 1024 })}`;
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types,@typescript-eslint/no-explicit-any
  public dumpConfig(org: string, repo: string, config: any, print = true): string {
    ui.updateBottomBar('');
    const configYaml = `
---
# Config Reference: 
# https://docs.saml.to/configuration/reference
${dump(config, { lineWidth: 1024 })}`;

    if (print) {
      console.log(`Here is the updated \`${CONFIG_FILE}\` for ${org}/${repo}:

${configYaml}

`);
    }

    return configYaml;
  }

  public async promptConfigUpdate(
    org: string,
    repo: string,
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types,@typescript-eslint/no-explicit-any
    config: any,
    title: string,
    print = true,
  ): Promise<boolean> {
    event(this.scms, 'fn:promptConfigUpdate', undefined, org);

    const configYaml = this.dumpConfig(org, repo, config, print);

    ui.updateBottomBar('');
    const { type } = await prompt('type', {
      type: 'list',
      name: 'type',
      message: `Would you like to push this configuration change to \`${org}/${repo}\`?`,
      default: 'nothing',
      choices: [
        {
          name: 'Do not change anything',
          value: 'nothing',
        },
        {
          name: `Commit directly to \`${org}/${repo}\``,
          value: 'commit',
        },
      ],
    });

    if (type === 'nothing') {
      ui.updateBottomBar('');
      console.log('All done. No changes were made.');
      return false;
    }

    if (type === 'commit') {
      await this.commitConfig(org, repo, configYaml, title);
    }
    return true;
  }

  private async commitConfig(
    org: string,
    repo: string,
    configYaml: string,
    title: string,
  ): Promise<void> {
    event(this.scms, 'fn:commitConfig', undefined, org);

    ui.updateBottomBar(`Updating ${CONFIG_FILE} on ${org}/${repo}`);
    const { github } = await this.scms.loadClients();
    if (!github) {
      throw new Error(NO_GITHUB_CLIENT);
    }

    let sha: string | undefined;

    try {
      const response = await github.repos.getContent({
        owner: org,
        repo,
        path: CONFIG_FILE,
      });
      if (response.data && 'content' in response.data) {
        sha = response.data.sha;
      }
    } catch (e) {
      //Pass
    }

    const { data: update } = await github.repos.createOrUpdateFileContents({
      owner: org,
      repo,
      path: CONFIG_FILE,
      message: title,
      content: Buffer.from(configYaml, 'utf8').toString('base64'),
      sha,
    });

    ui.updateBottomBar('');
    console.log(`Updated \`${CONFIG_FILE}\` on \`${org}/${repo}\` (SHA: ${update.commit.sha})`);
  }
}
