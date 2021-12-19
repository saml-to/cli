import inquirer from 'inquirer';
import { dump } from 'js-yaml';
import { NO_GITHUB_CLIENT } from '../messages';
import { Scms } from '../stores/scms';
import { ui } from '../command';
import { CONFIG_FILE } from '../commands/github-init';
import { IDPApi, Configuration } from '../../api/github-sls-rest-api';

export class ConfigHelper {
  scms: Scms;

  constructor() {
    this.scms = new Scms();
  }

  public async fetchConfigYaml(org: string, raw = false): Promise<string> {
    ui.updateBottomBar('Fetching config...');
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

  public async promptConfigUpdate(
    org: string,
    repo: string,
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types,@typescript-eslint/no-explicit-any
    config: any,
    title: string,
  ): Promise<void> {
    ui.updateBottomBar('');

    const configYaml = `
---
# Config Reference: 
# https://docs.saml.to/configuration/reference
${dump(config, { lineWidth: 1024 })}`;

    console.log(`Here is the updated \`${CONFIG_FILE}\` for ${org}/${repo}:

${configYaml}

`);

    ui.updateBottomBar('');
    const { type } = await inquirer.prompt({
      type: 'list',
      name: 'type',
      message: `Would you like to push this configuration change to \`${org}/${repo}\`?`,
      default: 'nothing',
      choices: [
        {
          name: 'Do not change anything',
          value: '',
        },
        {
          name: `Commit directly to \`${org}/${repo}\``,
          value: 'commit',
        },
      ],
    });

    if (type === 'commit') {
      return this.commitConfig(org, repo, configYaml, title);
    }

    ui.updateBottomBar('');
    console.log('All done. No changes were made.');
    return;
  }

  private async commitConfig(
    org: string,
    repo: string,
    configYaml: string,
    title: string,
  ): Promise<void> {
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
