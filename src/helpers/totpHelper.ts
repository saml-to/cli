import { prompt, ui } from '../../src/command';
import {
  GithubSlsRestApiChallenge,
  GithubSlsRestApiTotpMethod,
} from '../../api/github-sls-rest-api';
import { MISSING_CHALLENGE_METHODS, MISSING_CHALLENGE_URI } from '../../src/messages';
import { ApiHelper } from './apiHelper';
import { generateTotpQr } from './aws/qrCode';

export type RetryFunctionWithCode = (code: string) => Promise<void>;

export class TotpHelper {
  constructor(private apiHelper: ApiHelper) {}

  async promptChallenge(
    challenge: GithubSlsRestApiChallenge,
    token: string,
    retryFn: RetryFunctionWithCode,
    last?: {
      method: GithubSlsRestApiTotpMethod;
      recipient?: string;
    },
  ): Promise<void> {
    const { org, invitation, methods } = challenge;
    let { recipient } = challenge;

    if (last) {
      recipient = last.recipient;
    }

    if (!methods || !methods.length) {
      throw new Error(MISSING_CHALLENGE_METHODS(org));
    }

    let method: GithubSlsRestApiTotpMethod;

    if (invitation && !last) {
      ui.updateBottomBar('');
      const { methodIx } = await prompt('method', {
        type: 'list',
        name: 'methodIx',
        message: `By which method would you like to provide 2-factor codes?`,
        choices: methods.map((m, ix) => {
          return {
            name: `${m === GithubSlsRestApiTotpMethod.App ? 'Authenticator App' : 'Email'}`,
            value: ix,
          };
        }),
      });

      method = methods[methodIx];
      const totpApi = this.apiHelper.totpApi(token);

      ui.updateBottomBar(`Setting up 2-Factor authentication...`);

      const { data: enrollResponse } = await totpApi.totpEnroll(org, method, {
        invitation,
      });

      const { uri } = enrollResponse;
      recipient = enrollResponse.recipient;

      if (!uri) {
        throw new Error(MISSING_CHALLENGE_URI(org));
      }

      ui.updateBottomBar('');
      if (enrollResponse.method === GithubSlsRestApiTotpMethod.App) {
        console.log('Scan this QR Code using an Authenticator App:');
        const totpQr = await generateTotpQr(uri);
        console.log(`
${totpQr.qr}
Account Name: ${recipient}
Setup Key: ${totpQr.secret}
`);
      }
    } else {
      method = last ? last.method : methods[0];
    }

    let message: string;
    if (method === GithubSlsRestApiTotpMethod.App) {
      message = `Please enter the code in your Authenticator App for ${recipient}:`;
    } else {
      message = `Please enter the code sent to ${recipient} via ${method}:`;
    }

    ui.updateBottomBar('');
    const code = (
      await prompt('code', {
        type: 'password',
        name: 'code',
        message,
      })
    ).code as string;

    ui.updateBottomBar('Verifying code...');
    if (invitation) {
      const { data: response } = await this.apiHelper
        .totpApi(token, code)
        .totpEnroll(org, method, { invitation });
      if (!response.verified) {
        ui.updateBottomBar('The code is incorrect. Please try again.');
        return this.promptChallenge(challenge, token, retryFn, {
          recipient: response.recipient || recipient,
          method,
        });
      }
    }

    ui.updateBottomBar('');
    return retryFn(code);
  }
}
