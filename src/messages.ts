export const NO_GITHUB_CLIENT = 'There was an unknown issue loading GitHub client libraries';
export const NO_ORG = `No organization is set, please use the \`--org\` flag and re-run the command`;
export const ERROR_LOADING_FILE = (file: string, error: Error): string =>
  `Error loading file: ${file}: ${error.message}.`;
export const ERROR_ASSUMING_ROLE = (role: string, message: string): string =>
  `Unable to assume ${role}. ${message}.`;
export const MULTIPLE_ROLES = (role: string, message: string): string =>
  ERROR_ASSUMING_ROLE(
    role,
    `${message}

Tip: Use an exact role name, and/or the \`--provider\` and \`--org\` flags to narrow down to a specific role.
Tip: Use the \`show roles\` command to show avalable roles`,
  );
export const TERMINAL_NOT_SUPPORTED = (provider: string, recipient: string): string =>
  `Role assumption using ${provider} (${recipient}) is not supported by this CLI yet. However, you may request it as a feature: https://github.com/saml-to/cli/issues`;
export const UNSUPPORTED_REPO_URL = `Only the following repo URLs are supported: https://github.com/{org}/{repo}`;
export const GITHUB_ACCESS_NEEDED = (org: string, scope: string): string =>
  `To conitnue, access to scope '${scope}' in '${org}' is needed`;
export const GITHUB_SCOPE_NEEDED = (scope: string): string =>
  `To conitnue, scope '${scope}' is needed`;
export const REPO_DOES_NOT_EXIST = (org: string, repo: string): string =>
  `It doesn't appear ${org}/${repo} exists. Please create it or specify a different repository.`;
