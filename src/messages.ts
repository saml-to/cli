export const NOT_LOGGED_IN = 'To use this command, first use the `saml-to login` command.';
export const ERROR_LOADING_FILE = (file: string, error: Error): string =>
  `Error loading file: ${file}: ${error.message}.`;
export const ERROR_ASSUMING_ROLE = (role: string, message: string): string =>
  `Unable to assume ${role}. ${message}.`;
export const MULTIPLE_ROLES = (role: string, message: string): string =>
  ERROR_ASSUMING_ROLE(
    role,
    `${message}\n Tip: Use an exact role name, and/or the --provider and --org flags to narrow down to a specific role.`,
  );
export const TERMINAL_NOT_SUPPORTED = (provider: string, recipient: string): string =>
  `Role assumption using ${provider} (${recipient}) is not supported by this CLI yet. However, you may request it as a feature: https://github.com/saml-to/cli/issues`;
export const UNSUPPORTED_REPO_URL = `Only the following repo URLs are supported: https://github.com/{org}/{repo}`;
export const GITHUB_ACCESS_NEEDED = (org: string): string =>
  `To conitnue initialization, access to repositories in ${org} is needed`;
export const REPO_DOES_NOT_EXIST = (org: string, repo: string): string =>
  `It doesn't appear ${org}/${repo} exists. Please create it or specify a different repository.`;
