"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveSnippet = exports.runSnippet = void 0;
const codeManager_1 = require("./runner/codeManager");
const manager = new codeManager_1.CodeManager();
function runSnippet(lang, context) {
    if (lang !== "" && context !== "") {
        manager.run(lang, context);
    }
}
exports.runSnippet = runSnippet;
function saveSnippet(lang, context) {
    console.log("save");
}
exports.saveSnippet = saveSnippet;
//# sourceMappingURL=executor.js.map