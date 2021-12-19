"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenericHelper = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
class GenericHelper {
    async promptUsers(provider, role, users = []) {
        const { user } = await inquirer_1.default.prompt({
            type: 'input',
            name: 'user',
            message: `What is the Github ID of the user that will be allowed to ${role ? `assume \`${role}\`` : `login to ${provider}`}? (Leave blank if finished adding users)
`,
        });
        if (!user) {
            return users;
        }
        users.push(user);
        return this.promptUsers(provider, role, users);
    }
}
exports.GenericHelper = GenericHelper;
//# sourceMappingURL=genericHelper.js.map