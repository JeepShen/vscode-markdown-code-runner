'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.fetchfileExtension = exports.fetchLangExecutor = exports.getEditorShortcuts = exports.getWorkspaceConfiguration = void 0
const vscode = require('vscode')
const share_1 = require('./share')
function getWorkspaceConfiguration() {
  return vscode.workspace.getConfiguration('markdown-code-runner')
}
exports.getWorkspaceConfiguration = getWorkspaceConfiguration
function getEditorShortcuts() {
  return getWorkspaceConfiguration().get('editor.shortcuts', ['run'])
}
exports.getEditorShortcuts = getEditorShortcuts
/*
 * @param {string} lang
 */
function fetchLangExecutor(lang) {
  const maps = getWorkspaceConfiguration().get('executorMap', {
    sh: 'bash',
    python: 'python'
  })
  return maps[lang]
}
exports.fetchLangExecutor = fetchLangExecutor
function fetchfileExtension(lang) {
  return share_1.langExt.get(lang) || ''
}
exports.fetchfileExtension = fetchfileExtension
//# sourceMappingURL=utils.js.map
