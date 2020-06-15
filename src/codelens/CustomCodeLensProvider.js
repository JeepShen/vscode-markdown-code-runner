"use strict";
// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomCodeLensProvider = void 0;
const vscode = require("vscode");
const utils_1 = require("../utils");
const share_1 = require("../share");
class CustomCodeLensProvider {
    constructor() {
        this.onDidChangeCodeLensesEmitter = new vscode.EventEmitter();
        this.snippetStart = -1;
        this.snippetEnd = -1;
    }
    get onDidChangeCodeLenses() {
        return this.onDidChangeCodeLensesEmitter.event;
    }
    refresh() {
        this.onDidChangeCodeLensesEmitter.fire();
        //refresh
        this.snippetStart = -1;
        this.snippetEnd = -1;
    }
    provideCodeLenses(document) {
        // markdown
        if (document.languageId !== "markdown") {
            return;
        }
        const shortcuts = utils_1.getEditorShortcuts();
        if (!shortcuts) {
            return;
        }
        const snippetStartRegx = "\`\`\`(" + share_1.languages.join("|") + ")$";
        const snippetEndRegx = "\`\`\`$";
        const editor = vscode.window.activeTextEditor;
        let cursorLine = -1;
        if (editor && editor.selection.isEmpty && editor.selection.active.line > 0) {
            cursorLine = editor.selection.active.line;
        }
        else {
            return undefined;
        }
        //refresh
        this.snippetStart = -1;
        this.snippetEnd = -1;
        for (let i = cursorLine; i >= 0; i--) {
            const lineContent = document.lineAt(i).text;
            const res_end = lineContent.match(new RegExp(snippetEndRegx));
            if (res_end) {
                return undefined;
            }
            const res_start = lineContent.match(new RegExp(snippetStartRegx));
            if (res_start) {
                this.snippetStart = i;
                break;
            }
        }
        if (this.snippetStart === -1) {
            return undefined;
        }
        for (let i = cursorLine; i < document.lineCount; i++) {
            const lineContent = document.lineAt(i).text;
            const res_start = lineContent.match(new RegExp(snippetStartRegx));
            if (res_start) {
                return undefined;
            }
            const res_end = lineContent.match(new RegExp(snippetEndRegx));
            if (res_end) {
                this.snippetEnd = i;
                break;
            }
        }
        if (this.snippetEnd === -1) {
            return undefined;
        }
        const lang = document.lineAt(this.snippetStart).text.replace("```", "").trim();
        const lensRange = new vscode.Range(this.snippetEnd, 0, this.snippetEnd, 0);
        const snippetRange = new vscode.Range(this.snippetStart + 1, 0, this.snippetEnd, 0);
        const codeLens = [];
        if (shortcuts.indexOf("run") >= 0) {
            codeLens.push(new vscode.CodeLens(lensRange, {
                title: "Run",
                command: "markdown-code-runner.run",
                arguments: [lang, document.getText(snippetRange)],
            }));
        }
        if (shortcuts.indexOf("save") >= 0) {
            codeLens.push(new vscode.CodeLens(lensRange, {
                title: "Save",
                command: "markdown-code-runner.save",
                arguments: [lang, document.getText(snippetRange)],
            }));
        }
        return codeLens;
    }
}
exports.CustomCodeLensProvider = CustomCodeLensProvider;
//# sourceMappingURL=CustomCodeLensProvider.js.map