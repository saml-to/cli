"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scms = exports.NoTokenError = exports.CONFIG_DIR = void 0;
const rest_1 = require("@octokit/rest");
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// import { env } from 'process';
const messages_1 = require("../messages");
const command_1 = require("../command");
exports.CONFIG_DIR = `${path_1.default.join(os_1.default.homedir(), '.saml-to')}`;
class NoTokenError extends Error {
    constructor() {
        super('No token!');
    }
}
exports.NoTokenError = NoTokenError;
class Scms {
    githubFile;
    orgFile;
    constructor(configDir = exports.CONFIG_DIR) {
        this.githubFile = path_1.default.join(configDir, 'github-token.json');
        this.orgFile = path_1.default.join(configDir, 'org.json');
        if (!fs_1.default.existsSync(configDir)) {
            fs_1.default.mkdirSync(configDir);
        }
    }
    async loadClients() {
        const clients = {};
        clients.github = this.getOctokit();
        return clients;
    }
    saveGithubOrg(org) {
        fs_1.default.writeFileSync(this.orgFile, JSON.stringify({ name: org, scm: 'github' }));
        command_1.ui.updateBottomBar('');
        console.log(`Default organization cached in: ${this.orgFile}`);
        return this.orgFile;
    }
    saveGithubToken(token) {
        fs_1.default.writeFileSync(this.githubFile, JSON.stringify({ token }));
        command_1.ui.updateBottomBar('');
        console.log(`Token cached in: ${this.githubFile}`);
        return this.githubFile;
    }
    getGithubToken() {
        // if (env.GITHUB_TOKEN) {
        //   return env.GITHUB_TOKEN;
        // }
        if (!fs_1.default.existsSync(this.githubFile)) {
            throw new NoTokenError();
        }
        try {
            const { token } = JSON.parse(fs_1.default.readFileSync(this.githubFile).toString());
            return token;
        }
        catch (e) {
            if (e instanceof Error) {
                command_1.ui.updateBottomBar('');
                console.warn((0, messages_1.ERROR_LOADING_FILE)(this.githubFile, e));
                return;
            }
            throw e;
        }
    }
    getOrg() {
        if (!fs_1.default.existsSync(this.orgFile)) {
            return;
        }
        try {
            const { name } = JSON.parse(fs_1.default.readFileSync(this.orgFile).toString());
            return name;
        }
        catch (e) {
            if (e instanceof Error) {
                command_1.ui.updateBottomBar('');
                console.warn((0, messages_1.ERROR_LOADING_FILE)(this.githubFile, e));
                return;
            }
            throw e;
        }
    }
    getOctokit() {
        const token = this.getGithubToken();
        if (!token) {
            return;
        }
        return new rest_1.Octokit({ auth: token });
    }
}
exports.Scms = Scms;
//# sourceMappingURL=scms.js.map