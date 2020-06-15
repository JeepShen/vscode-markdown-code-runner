"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.codeLensController = void 0;
const vscode_1 = require("vscode");
const CustomCodeLensProvider_1 = require("./CustomCodeLensProvider");
class CodeLensController {
    constructor() {
        this.internalProvider = new CustomCodeLensProvider_1.CustomCodeLensProvider();
        this.configurationChangeListener = vscode_1.workspace.onDidChangeConfiguration((event) => {
            if (event.affectsConfiguration("markdown-code-runner.editor.shortcuts")) {
                this.internalProvider.refresh();
            }
        }, this);
        this.cursorChangeListener = vscode_1.window.onDidChangeTextEditorSelection((event) => {
            let editor = vscode_1.window.activeTextEditor;
            if (editor && editor.selection.isEmpty) {
                let position = editor.selection.active.line;
                if (position < this.internalProvider.snippetStart || position > this.internalProvider.snippetEnd) {
                    this.internalProvider.refresh();
                }
            }
        }, this);
        this.registeredProvider = vscode_1.languages.registerCodeLensProvider({ scheme: "file" }, this.internalProvider);
    }
    dispose() {
        if (this.registeredProvider) {
            this.dispose();
        }
        this.configurationChangeListener.dispose();
        this.cursorChangeListener.dispose();
    }
}
exports.codeLensController = new CodeLensController();
//# sourceMappingURL=CodeLensController.js.map