import axios from 'axios';
import crypto from 'crypto';
import { Scms } from '../stores/scms';

export const event = (scms: Scms, action: string, subAction?: string, org?: string): void => {
  const dnt = process.env.SAML_TO_DNT;
  if (dnt) {
    return;
  }

  let anonymousOrg: string;
  try {
    org = org ? org : scms.getOrg();
    if (!org) {
      throw new Error();
    }
    anonymousOrg = crypto.createHash('sha256').update(org).digest('hex');
  } catch (e2) {
    anonymousOrg = crypto.createHash('sha256').update('unknown').digest('hex');
  }

  let anonymousId: string;
  try {
    const token = scms.getGithubToken();
    if (!token) {
      throw new Error();
    }
    anonymousId = crypto.createHash('sha256').update(token).digest('hex');
  } catch (e) {
    anonymousId = anonymousOrg;
  }

  axios
    .post(
      `https://api.segment.io/v1/track`,
      {
        anonymousId,
        event: action,
        properties: {
          anonymousOrg,
          subAction: subAction,
        },
      },
      { auth: { username: 'UcQlAMIhPSYCKCyixGgxKwslx0MqbAZf', password: '' } },
    )
    .then(() => {})
    .catch(() => {});
};
