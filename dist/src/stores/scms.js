"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scms = void 0;
const rest_1 = require("@octokit/rest");
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// import { env } from 'process';
const messages_1 = require("../messages");
class Scms {
    configDir;
    githubFile;
    constructor() {
        this.configDir = `${path_1.default.join(os_1.default.homedir(), '.saml-to')}`;
        this.githubFile = path_1.default.join(this.configDir, 'github-token.json');
        if (!fs_1.default.existsSync(this.configDir)) {
            fs_1.default.mkdirSync(this.configDir);
        }
    }
    async loadClients() {
        const clients = {};
        clients.github = this.getOctokit();
        return clients;
    }
    saveGithubToken(token) {
        fs_1.default.writeFileSync(this.githubFile, JSON.stringify({ token }));
        return this.githubFile;
    }
    getGithubToken() {
        // if (env.GITHUB_TOKEN) {
        //   return env.GITHUB_TOKEN;
        // }
        if (!fs_1.default.existsSync(this.githubFile)) {
            return;
        }
        try {
            const { token } = JSON.parse(fs_1.default.readFileSync(this.githubFile).toString());
            return token;
        }
        catch (e) {
            if (e instanceof Error) {
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