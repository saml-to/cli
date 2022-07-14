export const NO_GITHUB_CLIENT = 'There was an unknown issue loading GitHub client libraries';
export const NO_ORG = `No organization is set, please use the \`--org\` flag and re-run the command`;
export const NOT_LOGGED_IN = (processName: string, provider: string): string =>
  `Invalid or missing token. Please login using the \`${processName} login ${provider}\` command to save your identity to this system.`;
export const ERROR_LOADING_FILE = (file: string, error: Error): string =>
  `Error loading file: ${file}: ${error.message}.`;
export const ERROR_ASSUMING_ROLE = (role: string, message: string): string =>
  `Unable to assume ${role}. ${message}.`;
export const ERROR_LOGGING_IN = (provider: string, message: string): string =>
  `Unable to login to ${provider}. ${message}.`;
export const MULTIPLE_ROLES = (role: string, message: string): string =>
  ERROR_ASSUMING_ROLE(
    role,
    `${message}

Tip: Use an exact role name, and/or the \`--provider\` and \`--org\` flags to narrow down to a specific role.
Tip: Use the \`show roles\` command to show avalable roles`,
  );
export const MULTIPLE_LOGINS = (provider: string, message: string): string =>
  ERROR_ASSUMING_ROLE(
    provider,
    `${message}

Tip: Use an exact org name, using the \`--org\` flag to narrow down to a specific organization.
Tip: Use the \`show logins\` command to show avalable roles`,
  );
export const TERMINAL_NOT_SUPPORTED = (provider: string, recipient: string): string =>
  `Role assumption using ${provider} (${recipient}) is not supported by this CLI yet. However, you may request it as a feature: https://github.com/saml-to/cli/issues`;
export const UNSUPPORTED_REPO_URL = `Only the following repo URLs are supported: https://github.com/{org}/{repo}`;
export const GITHUB_ACCESS_NEEDED = (org: string, scope: string): string =>
  `To continue, access to scope '${scope}' in '${org}' is needed`;
export const GITHUB_SCOPE_NEEDED = (scope: string): string =>
  `To continue, scope '${scope}' is needed`;
export const REPO_DOES_NOT_EXIST = (org: string, repo: string): string =>
  `${org}/${repo} does not exist. Please create it or specify a different repository.`;
