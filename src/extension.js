"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode_1 = require("vscode");
const CodeLensController_1 = require("./codelens/CodeLensController");
const executor = require("./executor");
/**
 * @param {ExtensionContext} context
 */
function activate(context) {
    context.subscriptions.push(CodeLensController_1.codeLensController, vscode_1.commands.registerCommand("markdown-code-runner.run", (lang, context) => executor.runSnippet(lang, context)), vscode_1.commands.registerCommand("markdown-code-runner.save", (lang, context) => executor.saveSnippet(lang, context)));
}
exports.activate = activate;
;
// this method is called when your extension is deactivated
function deactivate() {
    //Do nothing
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map