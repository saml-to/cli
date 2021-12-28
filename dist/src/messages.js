"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REPO_DOES_NOT_EXIST = exports.GITHUB_SCOPE_NEEDED = exports.GITHUB_ACCESS_NEEDED = exports.UNSUPPORTED_REPO_URL = exports.TERMINAL_NOT_SUPPORTED = exports.MULTIPLE_LOGINS = exports.MULTIPLE_ROLES = exports.ERROR_LOGGING_IN = exports.ERROR_ASSUMING_ROLE = exports.ERROR_LOADING_FILE = exports.NO_ORG = exports.NO_GITHUB_CLIENT = void 0;
exports.NO_GITHUB_CLIENT = 'There was an unknown issue loading GitHub client libraries';
exports.NO_ORG = `No organization is set, please use the \`--org\` flag and re-run the command`;
const ERROR_LOADING_FILE = (file, error) => `Error loading file: ${file}: ${error.message}.`;
exports.ERROR_LOADING_FILE = ERROR_LOADING_FILE;
const ERROR_ASSUMING_ROLE = (role, message) => `Unable to assume ${role}. ${message}.`;
exports.ERROR_ASSUMING_ROLE = ERROR_ASSUMING_ROLE;
const ERROR_LOGGING_IN = (provider, message) => `Unable to login to ${provider}. ${message}.`;
exports.ERROR_LOGGING_IN = ERROR_LOGGING_IN;
const MULTIPLE_ROLES = (role, message) => (0, exports.ERROR_ASSUMING_ROLE)(role, `${message}

Tip: Use an exact role name, and/or the \`--provider\` and \`--org\` flags to narrow down to a specific role.
Tip: Use the \`show roles\` command to show avalable roles`);
exports.MULTIPLE_ROLES = MULTIPLE_ROLES;
const MULTIPLE_LOGINS = (provider, message) => (0, exports.ERROR_ASSUMING_ROLE)(provider, `${message}

Tip: Use an exact org name, using the \`--org\` flag to narrow down to a specific organization.
Tip: Use the \`show logins\` command to show avalable roles`);
exports.MULTIPLE_LOGINS = MULTIPLE_LOGINS;
const TERMINAL_NOT_SUPPORTED = (provider, recipient) => `Role assumption using ${provider} (${recipient}) is not supported by this CLI yet. However, you may request it as a feature: https://github.com/saml-to/cli/issues`;
exports.TERMINAL_NOT_SUPPORTED = TERMINAL_NOT_SUPPORTED;
exports.UNSUPPORTED_REPO_URL = `Only the following repo URLs are supported: https://github.com/{org}/{repo}`;
const GITHUB_ACCESS_NEEDED = (org, scope) => `To continue, access to scope '${scope}' in '${org}' is needed`;
exports.GITHUB_ACCESS_NEEDED = GITHUB_ACCESS_NEEDED;
const GITHUB_SCOPE_NEEDED = (scope) => `To continue, scope '${scope}' is needed`;
exports.GITHUB_SCOPE_NEEDED = GITHUB_SCOPE_NEEDED;
const REPO_DOES_NOT_EXIST = (org, repo) => `${org}/${repo} does not exist. Please create it or specify a different repository.`;
exports.REPO_DOES_NOT_EXIST = REPO_DOES_NOT_EXIST;
//# sourceMappingURL=messages.js.map