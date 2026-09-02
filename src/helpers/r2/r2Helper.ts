import moment from 'moment';
import { GithubSlsRestApiCloudflareR2SdkOptions } from '../../../api/github-sls-rest-api';
import { ui } from '../../command';
import { exec } from '../execHelper';
import { GenericHelper } from '../genericHelper';
import { buildR2Env, buildR2ProfileSettings } from './env';

export class R2Helper {
  constructor(private genericHelper: GenericHelper) {}

  /**
   * Hand Cloudflare R2 credentials to the shell (`--headless`) or to an `~/.aws` profile (`--save`).
   * There is no web console to open for a bucket, so there is no browser path.
   */
  async assumeR2(
    options: GithubSlsRestApiCloudflareR2SdkOptions,
    save?: string,
    headless?: boolean,
  ): Promise<void> {
    if (save) {
      if (!headless) {
        ui.updateBottomBar(`Updating AWS '${save}' Profile...`);
      }

      const base = ['aws', 'configure'];
      if (save !== 'default') {
        base.push('--profile', save);
      }
      base.push('set');

      // eslint-disable-next-line no-restricted-syntax
      for (const [key, value] of buildR2ProfileSettings(options)) {
        // eslint-disable-next-line no-await-in-loop
        await exec([...base, key, value]);
      }

      if (headless) {
        try {
          this.genericHelper.outputEnv({ AWS_PROFILE: save });
          return;
        } catch (e) {
          // pass
        }
      } else {
        ui.updateBottomBar('');
        console.log(
          `
✅ A profile named \`${save}\` was updated in the AWS Configuration (~/.aws) for Cloudflare R2 bucket \`${
            options.bucket
          }\`.

ℹ️  Credentials will expire ${moment(
            options.expiration,
          ).fromNow()}! Re-run this command to get fresh credentials.`,
        );
      }

      return;
    }

    this.genericHelper.outputEnv(buildR2Env(options));
  }
}
