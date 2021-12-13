"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REPO_DOES_NOT_EXIST = exports.GITHUB_ACCESS_NEEDED = exports.UNSUPPORTED_REPO_URL = exports.TERMINAL_NOT_SUPPORTED = exports.MULTIPLE_ROLES = exports.ERROR_ASSUMING_ROLE = exports.ERROR_LOADING_FILE = exports.NOT_LOGGED_IN = void 0;
exports.NOT_LOGGED_IN = 'To use this command, first use the `saml-to login` command.';
const ERROR_LOADING_FILE = (file, error) => `Error loading file: ${file}: ${error.message}.`;
exports.ERROR_LOADING_FILE = ERROR_LOADING_FILE;
const ERROR_ASSUMING_ROLE = (role, message) => `Unable to assume ${role}. ${message}.`;
exports.ERROR_ASSUMING_ROLE = ERROR_ASSUMING_ROLE;
const MULTIPLE_ROLES = (role, message) => (0, exports.ERROR_ASSUMING_ROLE)(role, `${message}\n Tip: Use an exact role name, and/or the --provider and --org flags to narrow down to a specific role.`);
exports.MULTIPLE_ROLES = MULTIPLE_ROLES;
const TERMINAL_NOT_SUPPORTED = (provider, recipient) => `Role assumption using ${provider} (${recipient}) is not supported by this CLI yet. However, you may request it as a feature: https://github.com/saml-to/cli/issues`;
exports.TERMINAL_NOT_SUPPORTED = TERMINAL_NOT_SUPPORTED;
exports.UNSUPPORTED_REPO_URL = `Only the following repo URLs are supported: https://github.com/{org}/{repo}`;
const GITHUB_ACCESS_NEEDED = (org) => `To conitnue initialization, access to repositories in ${org} is needed`;
exports.GITHUB_ACCESS_NEEDED = GITHUB_ACCESS_NEEDED;
const REPO_DOES_NOT_EXIST = (org, repo) => `It doesn't appear ${org}/${repo} exists. Please create it or specify a different repository.`;
exports.REPO_DOES_NOT_EXIST = REPO_DOES_NOT_EXIST;
//# sourceMappingURL=messages.js.map