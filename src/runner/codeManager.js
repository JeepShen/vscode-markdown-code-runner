"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeManager = void 0;
const fs = require("fs");
const os = require("os");
const path_1 = require("path");
const vscode = require("vscode");
const utils = require("../utils");
const TmpDir = os.tmpdir();
class CodeManager {
    constructor() {
        this._TERMINAL_DEFAULT_SHELL_WINDOWS = null;
        console.log("constructor");
        this._outputChannel = vscode.window.createOutputChannel("Code");
        this._isRunning = false;
        this._process = null;
        this._codeFile = "";
        this._isTmpFile = true;
        this._languageId = "";
        this._cwd = TmpDir;
        this._config = utils.getWorkspaceConfiguration();
        this._workspaceFolder = "./";
    }
    onDidCloseTerminal() {
        this._terminal = null;
    }
    run(languageId = "", context = "") {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._isRunning) {
                vscode.window.showInformationMessage("Code is already running!");
                return;
            }
            if (languageId === "" || context === "") {
                vscode.window.showInformationMessage("Language is not supported!");
                return;
            }
            this._languageId = languageId;
            const executor = utils.fetchLangExecutor(languageId);
            const fileExtension = utils.fetchfileExtension(languageId);
            // undefined or null
            if (executor === "" || fileExtension === "") {
                vscode.window.showInformationMessage("Code language not supported or defined.");
                return;
            }
            console.log(executor, fileExtension);
            this.getCodeFileAndExecute(fileExtension, executor, context);
        });
    }
    stop() {
        this.stopRunning();
    }
    dispose() {
        this.stopRunning();
    }
    stopRunning() {
        if (this._isRunning) {
            this._isRunning = false;
            const kill = require("tree-kill");
            kill(this._process.pid);
        }
    }
    getCodeFileAndExecute(fileExtension, executor, context, appendFile = true) {
        let text = context;
        if (this._languageId === "php") {
            text = text.trim();
            if (!text.startsWith("<?php")) {
                text = "<?php\r\n" + text + "\r\n?>";
            }
        }
        this._isTmpFile = true;
        this.createRandomFile(text, this._cwd, fileExtension);
        this.executeCommand(executor, appendFile);
    }
    rndName() {
        return Math.random().toString(36).replace(/[^a-z]+/g, "").substr(0, 10);
    }
    createRandomFile(content, folder, fileExtension) {
        let fileType = "";
        if (fileExtension) {
            fileType = fileExtension;
        }
        else {
            fileType = "." + this._languageId;
        }
        const tmpFileNameWithoutExt = "temp" + this.rndName();
        const tmpFileName = tmpFileNameWithoutExt + fileType;
        this._codeFile = path_1.join(folder, tmpFileName);
        fs.writeFileSync(this._codeFile, content);
    }
    executeCommand(executor, appendFile = true) {
        if (this._config.get("runInTerminal")) {
            this.executeCommandInTerminal(executor, appendFile);
        }
        else {
            this.executeCommandInOutputChannel(executor, appendFile);
        }
    }
    getWorkspaceRoot(codeFileDir) {
        return this._workspaceFolder ? this._workspaceFolder : codeFileDir;
    }
    /**
     * Gets the base name of the code file, that is without its directory.
     */
    getCodeBaseFile() {
        const regexMatch = this._codeFile.match(/.*[\/\\](.*)/);
        return regexMatch ? regexMatch[1] : this._codeFile;
    }
    /**
     * Gets the code file name without its directory and extension.
     */
    getCodeFileWithoutDirAndExt() {
        const regexMatch = this._codeFile.match(/.*[\/\\](.*(?=\..*))/);
        return regexMatch ? regexMatch[1] : this._codeFile;
    }
    /**
     * Gets the directory of the code file.
     */
    getCodeFileDir() {
        const regexMatch = this._codeFile.match(/(.*[\/\\]).*/);
        return regexMatch ? regexMatch[1] : this._codeFile;
    }
    /**
     * Gets the drive letter of the code file.
     */
    getDriveLetter() {
        const regexMatch = this._codeFile.match(/^([A-Za-z]:).*/);
        return regexMatch ? regexMatch[1] : "$driveLetter";
    }
    /**
     * Gets the directory of the code file without a trailing slash.
     */
    getCodeFileDirWithoutTrailingSlash() {
        return this.getCodeFileDir().replace(/[\/\\]$/, "");
    }
    /**
     * Includes double quotes around a given file name.
     */
    quoteFileName(fileName) {
        return '\"' + fileName + '\"';
    }
    /**
     * Gets the executor to run a source code file
     * and generates the complete command that allow that file to be run.
     * This executor command may include a variable $1 to indicate the place where
     * the source code file name have to be included.
     * If no such a variable is present in the executor command,
     * the file name is appended to the end of the executor command.
     *
     * @param executor The command used to run a source code file
     * @return the complete command to run the file, that includes the file name
     */
    getFinalCommandToRunCodeFile(executor, appendFile = true) {
        return __awaiter(this, void 0, void 0, function* () {
            let cmd = executor;
            if (this._codeFile) {
                const codeFileDir = this.getCodeFileDir();
                const pythonPath = "python3";
                const placeholders = [
                    // A placeholder that has to be replaced by the path of the folder opened in VS Code
                    // If no folder is opened, replace with the directory of the code file
                    { regex: /\$workspaceRoot/g, replaceValue: this.getWorkspaceRoot(codeFileDir) },
                    // A placeholder that has to be replaced by the code file name without its extension
                    { regex: /\$fileNameWithoutExt/g, replaceValue: this.getCodeFileWithoutDirAndExt() },
                    // A placeholder that has to be replaced by the full code file name
                    { regex: /\$fullFileName/g, replaceValue: this.quoteFileName(this._codeFile) },
                    // A placeholder that has to be replaced by the code file name without the directory
                    { regex: /\$fileName/g, replaceValue: this.getCodeBaseFile() },
                    // A placeholder that has to be replaced by the drive letter of the code file (Windows only)
                    { regex: /\$driveLetter/g, replaceValue: this.getDriveLetter() },
                    // A placeholder that has to be replaced by the directory of the code file without a trailing slash
                    { regex: /\$dirWithoutTrailingSlash/g, replaceValue: this.quoteFileName(this.getCodeFileDirWithoutTrailingSlash()) },
                    // A placeholder that has to be replaced by the directory of the code file
                    { regex: /\$dir/g, replaceValue: this.quoteFileName(codeFileDir) },
                    // A placeholder that has to be replaced by the path of Python interpreter
                    { regex: /\$pythonPath/g, replaceValue: pythonPath },
                ];
                placeholders.forEach((placeholder) => {
                    cmd = cmd.replace(placeholder.regex, placeholder.replaceValue);
                });
            }
            return (cmd !== executor ? cmd : executor + (appendFile ? " " + this.quoteFileName(this._codeFile) : ""));
        });
    }
    changeExecutorFromCmdToPs(executor) {
        if (os.platform() === "win32") {
            let windowsShell = vscode.workspace.getConfiguration("terminal").get("integrated.shell.windows");
            if (windowsShell === null) {
                windowsShell = this.getTerminalDefaultShellWindows();
            }
            if (windowsShell && windowsShell.toLowerCase().indexOf("powershell") > -1 && executor.indexOf(" && ") > -1) {
                let replacement = "; if ($?) {";
                executor = executor.replace("&&", replacement);
                replacement = "} " + replacement;
                executor = executor.replace(/&&/g, replacement);
                executor = executor.replace(/\$dir\$fileNameWithoutExt/g, ".\\$fileNameWithoutExt");
                return executor + " }";
            }
        }
        return executor;
    }
    /*
    Workaround for https://github.com/formulahendry/vscode-code-runner/issues/491
    The following code is based on https://github.com/microsoft/vscode-maven/commit/7c1dea723fe91f665c4e624e3bf71a411ceafd93
    This is only a fall back to identify the default shell used by VSC.
    */
    getTerminalDefaultShellWindows() {
        if (!this._TERMINAL_DEFAULT_SHELL_WINDOWS) {
            const isAtLeastWindows10 = os.platform() === "win32" && parseFloat(os.release()) >= 10;
            const is32ProcessOn64Windows = process.env.hasOwnProperty("PROCESSOR_ARCHITEW6432");
            const powerShellPath = `${process.env.windir}\\${is32ProcessOn64Windows ? "Sysnative" : "System32"}\\WindowsPowerShell\\v1.0\\powershell.exe`;
            this._TERMINAL_DEFAULT_SHELL_WINDOWS = isAtLeastWindows10 ? powerShellPath : this.getWindowsShell();
        }
        return this._TERMINAL_DEFAULT_SHELL_WINDOWS;
    }
    getWindowsShell() {
        return process.env.comspec || "cmd.exe";
    }
    changeFilePathForBashOnWindows(command) {
        if (os.platform() === "win32") {
            const windowsShell = vscode.workspace.getConfiguration("terminal").get("integrated.shell.windows");
            const terminalRoot = this._config.get("terminalRoot");
            if (windowsShell && terminalRoot) {
                command = command
                    .replace(/([A-Za-z]):\\/g, (match, p1) => `${terminalRoot}${p1.toLowerCase()}/`)
                    .replace(/\\/g, "/");
            }
            else if (windowsShell && windowsShell.toLowerCase().indexOf("bash") > -1 && windowsShell.toLowerCase().indexOf("windows") > -1) {
                command = command.replace(/([A-Za-z]):\\/g, this.replacer).replace(/\\/g, "/");
            }
        }
        return command;
    }
    replacer(match, p1) {
        return `/mnt/${p1.toLowerCase()}/`;
    }
    executeCommandInTerminal(executor, appendFile = true) {
        return __awaiter(this, void 0, void 0, function* () {
            let isNewTerminal = false;
            if (this._terminal === null || this._terminal === undefined) {
                console.log(this._terminal);
                this._terminal = vscode.window.createTerminal("Code");
                isNewTerminal = true;
            }
            this._terminal.show();
            this.sendRunEvent(executor, true);
            executor = this.changeExecutorFromCmdToPs(executor);
            let command = yield this.getFinalCommandToRunCodeFile(executor, appendFile);
            command = this.changeFilePathForBashOnWindows(command);
            if (!isNewTerminal) {
                try {
                    yield vscode.commands.executeCommand("workbench.action.terminal.clear"); 
                } 
                catch (e) { 
                    console.warn("vscode-markdown-code-runner: workbench.action.terminal.clear could not execute, skipping")
                }
            }
            this._terminal.sendText(command);
        });
    }
    executeCommandInOutputChannel(executor, appendFile = true) {
        return __awaiter(this, void 0, void 0, function* () {
            this._isRunning = true;
            const clearPreviousOutput = this._config.get("clearPreviousOutput");
            if (clearPreviousOutput) {
                this._outputChannel.clear();
            }
            const showExecutionMessage = this._config.get("showExecutionMessage");
            this._outputChannel.show(this._config.get("preserveFocus"));
            const spawn = require("child_process").spawn;
            const command = yield this.getFinalCommandToRunCodeFile(executor, appendFile);
            if (showExecutionMessage) {
                this._outputChannel.appendLine("[Running] " + command);
            }
            this.sendRunEvent(executor, false);
            const startTime = new Date();
            this._process = spawn(command, [], { cwd: this._cwd, shell: true });
            this._process.stdout.on("data", (data) => {
                this._outputChannel.append(data.toString());
            });
            this._process.stderr.on("data", (data) => {
                this._outputChannel.append(data.toString());
            });
            this._process.on("close", (code) => {
                this._isRunning = false;
                const endTime = new Date();
                const elapsedTime = (endTime.getTime() - startTime.getTime()) / 1000;
                this._outputChannel.appendLine("");
                if (showExecutionMessage) {
                    this._outputChannel.appendLine("[Done] exited with code=" + code + " in " + elapsedTime + " seconds");
                    this._outputChannel.appendLine("");
                }
                if (this._isTmpFile) {
                    fs.unlinkSync(this._codeFile);
                }
            });
        });
    }
    sendRunEvent(executor, runFromTerminal) {
        const properties = {
            runFromTerminal: runFromTerminal.toString(),
            isTmpFile: this._isTmpFile.toString(),
        };
    }
}
exports.CodeManager = CodeManager;
//# sourceMappingURL=codeManager.js.map