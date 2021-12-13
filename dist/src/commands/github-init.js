"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GithubInit = void 0;
// import { RequestError } from '@octokit/request-error';
const request_error_1 = require("@octokit/request-error");
const loglevel_1 = __importDefault(require("loglevel"));
const messages_1 = require("../messages");
const github_login_1 = require("./github-login");
const prompts_1 = __importDefault(require("prompts"));
const REPO_REGEX = /^.*github\.com[:/]+(?<org>.*)\/(?<repo>.*?)(.git)*$/gm;
const isGithubRepo = (repoUrl) => {
    const match = REPO_REGEX.exec(repoUrl);
    if (!match || !match.groups) {
        return {};
    }
    return {
        org: match.groups.org,
        repo: match.groups.repo,
    };
};
class GithubInit {
    githubLogin;
    constructor() {
        this.githubLogin = new github_login_1.GithubLogin();
    }
    async handle(repoUrl) {
        const { org, repo } = isGithubRepo(repoUrl);
        if (!org || !repo) {
            loglevel_1.default.debug('Not a github repo', repoUrl);
            return false;
        }
        await this.assertRepo(org, repo);
        await this.assertConfig(org, repo);
        return true;
        // Check if config file exists
        // Validate config
    }
    async assertRepo(org, repo) {
        loglevel_1.default.debug('Checking for access to', org, repo);
        const { github } = await this.githubLogin.scms.loadClients();
        if (!github) {
            throw new Error(messages_1.NOT_LOGGED_IN);
        }
        const { data: user, headers } = await github.users.getAuthenticated();
        try {
            this.assertScopes(headers, 'repo');
        }
        catch (e) {
            if (e instanceof Error) {
                loglevel_1.default.debug(e.message);
                console.log((0, messages_1.GITHUB_ACCESS_NEEDED)(org));
                await this.githubLogin.handle('repo');
                return this.assertRepo(org, repo);
            }
            throw e;
        }
        if (user.login.toLowerCase() !== org.toLowerCase()) {
            try {
                await github.orgs.checkMembershipForUser({ org, username: user.login });
            }
            catch (e) {
                if (e instanceof Error) {
                    loglevel_1.default.debug(e.message);
                    console.log((0, messages_1.GITHUB_ACCESS_NEEDED)(org));
                    await this.githubLogin.handle('repo');
                    return this.assertRepo(org, repo);
                }
            }
        }
        try {
            await github.repos.get({ owner: org, repo });
        }
        catch (e) {
            if (e instanceof Error) {
                loglevel_1.default.debug(e.message);
                throw new Error((0, messages_1.REPO_DOES_NOT_EXIST)(org, repo));
            }
        }
    }
    assertScopes(headers, expectedScope) {
        const xOauthScopes = headers['x-oauth-scopes'];
        loglevel_1.default.debug('Current scopes:', xOauthScopes);
        const scopes = xOauthScopes.split(' ');
        if (scopes.includes(expectedScope)) {
            return;
        }
        throw new Error(`Missing scope. Expected:${expectedScope} Actual:${scopes}`);
    }
    async assertConfig(org, repo, file = 'saml-to.yml') {
        loglevel_1.default.debug('Checking for config file', org, repo, file);
        const { github } = await this.githubLogin.scms.loadClients();
        if (!github) {
            throw new Error(messages_1.NOT_LOGGED_IN);
        }
        try {
            await github.repos.getContent({ owner: org, repo, path: file });
            console.log(`Found an existing config file: ${file} in ${org}/${repo}`);
        }
        catch (e) {
            if (e instanceof request_error_1.RequestError && e.status === 404) {
                console.log(`It appears that ${file} does not exist in ${org}/${repo}`);
                const response = await (0, prompts_1.default)({
                    type: 'confirm',
                    name: 'createFile',
                    message: 'Would you like me to setup a configuration file for you?',
                });
                if (!response.createFile) {
                    throw new Error(`Config file ${file} does not exist in ${org}/${repo}`);
                }
                await this.createConfig(org, repo, file);
                return;
            }
            throw e;
        }
        const content = await github.repos.getContent({ owner: org, repo, path: file });
        console.log('!!! content', content);
    }
    async listExamples() {
        const { github } = await this.githubLogin.scms.loadClients();
        if (!github) {
            throw new Error(messages_1.NOT_LOGGED_IN);
        }
        console.log('!!! getting config from saml-to');
        const content = await github.repos.getContent({
            owner: 'saml-to',
            repo: 'cli',
            path: 'examples',
        });
        console.log('!!! content', content);
    }
    async createConfig(org, repo, file) {
        loglevel_1.default.debug('Creating config', org, repo, file);
        await this.listExamples();
    }
}
exports.GithubInit = GithubInit;
//# sourceMappingURL=github-init.js.map