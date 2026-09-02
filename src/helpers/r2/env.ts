/**
 * Pure helpers for Cloudflare R2 credentials. No side effects, no heavy imports.
 */

export const R2_HOST_SUFFIX = '.r2.cloudflarestorage.com';

export type R2CredentialOptions = {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  endpoint: string;
};

export type R2Env = {
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  AWS_SESSION_TOKEN: string;
  AWS_REGION: string;
  AWS_DEFAULT_REGION: string;
  AWS_ENDPOINT_URL: string;
  AWS_REQUEST_CHECKSUM_CALCULATION: string;
  AWS_RESPONSE_CHECKSUM_VALIDATION: string;
};

/**
 * Environment variables that make the AWS CLI and SDKs talk to R2 without any flags:
 * region `auto`, the account endpoint, and checksum settings R2 accepts.
 */
export const buildR2Env = (options: R2CredentialOptions): R2Env => ({
  AWS_ACCESS_KEY_ID: options.accessKeyId,
  AWS_SECRET_ACCESS_KEY: options.secretAccessKey,
  AWS_SESSION_TOKEN: options.sessionToken,
  AWS_REGION: 'auto',
  AWS_DEFAULT_REGION: 'auto',
  AWS_ENDPOINT_URL: options.endpoint,
  AWS_REQUEST_CHECKSUM_CALCULATION: 'when_required',
  AWS_RESPONSE_CHECKSUM_VALIDATION: 'when_required',
});

/**
 * `aws configure set` key/value pairs equivalent to `buildR2Env`, for `--save`.
 */
export const buildR2ProfileSettings = (options: R2CredentialOptions): [string, string][] => [
  ['region', 'auto'],
  ['endpoint_url', options.endpoint],
  ['aws_access_key_id', options.accessKeyId],
  ['aws_secret_access_key', options.secretAccessKey],
  ['aws_session_token', options.sessionToken],
  ['request_checksum_calculation', 'when_required'],
  ['response_checksum_validation', 'when_required'],
];

/**
 * Roles for `cloudflare-r2` providers are listed with the R2 endpoint as their issuer.
 */
export const isR2Issuer = (issuer?: string): boolean => {
  if (!issuer) {
    return false;
  }
  try {
    return new URL(issuer).host.endsWith(R2_HOST_SUFFIX);
  } catch (e) {
    return false;
  }
};
