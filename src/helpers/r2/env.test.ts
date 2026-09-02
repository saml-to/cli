import { buildR2Env, buildR2ProfileSettings, isR2Issuer } from './env';

const options = {
  accessKeyId: 'AKIA',
  secretAccessKey: 'secret',
  sessionToken: 'token',
  endpoint: 'https://acct.r2.cloudflarestorage.com',
};

describe('buildR2Env', () => {
  it('produces the S3-shaped environment with endpoint, region and checksum settings', () => {
    expect(buildR2Env(options)).toEqual({
      AWS_ACCESS_KEY_ID: 'AKIA',
      AWS_SECRET_ACCESS_KEY: 'secret',
      AWS_SESSION_TOKEN: 'token',
      AWS_REGION: 'auto',
      AWS_DEFAULT_REGION: 'auto',
      AWS_ENDPOINT_URL: 'https://acct.r2.cloudflarestorage.com',
      AWS_REQUEST_CHECKSUM_CALCULATION: 'when_required',
      AWS_RESPONSE_CHECKSUM_VALIDATION: 'when_required',
    });
  });

  it('keeps the keys in a stable order for the export line', () => {
    expect(Object.keys(buildR2Env(options))).toEqual([
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY',
      'AWS_SESSION_TOKEN',
      'AWS_REGION',
      'AWS_DEFAULT_REGION',
      'AWS_ENDPOINT_URL',
      'AWS_REQUEST_CHECKSUM_CALCULATION',
      'AWS_RESPONSE_CHECKSUM_VALIDATION',
    ]);
  });
});

describe('buildR2ProfileSettings', () => {
  it('mirrors the environment as aws configure settings', () => {
    expect(buildR2ProfileSettings(options)).toEqual([
      ['region', 'auto'],
      ['endpoint_url', 'https://acct.r2.cloudflarestorage.com'],
      ['aws_access_key_id', 'AKIA'],
      ['aws_secret_access_key', 'secret'],
      ['aws_session_token', 'token'],
      ['request_checksum_calculation', 'when_required'],
      ['response_checksum_validation', 'when_required'],
    ]);
  });
});

describe('isR2Issuer', () => {
  it('recognises R2 endpoints, including jurisdictions', () => {
    expect(isR2Issuer('https://acct.r2.cloudflarestorage.com')).toBe(true);
    expect(isR2Issuer('https://acct.eu.r2.cloudflarestorage.com')).toBe(true);
  });

  it('rejects everything else', () => {
    expect(isR2Issuer('https://signin.aws.amazon.com/saml')).toBe(false);
    expect(isR2Issuer('https://slack.com')).toBe(false);
    expect(isR2Issuer(undefined)).toBe(false);
    expect(isR2Issuer('not a url')).toBe(false);
  });
});
