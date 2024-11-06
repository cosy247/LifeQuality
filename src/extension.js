const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const updateCss = require('./updateCss');

const CONFIG_HEAD = 'vsbackground';
const COMMAND_ID = 'changeBackground';

function getWebViewContent(context, templatePaths) {
    let html = '';
    let tempPath = '';
    for (const templatePath of templatePaths) {
        try {
            const resourcePath = path.join(context.extensionPath, templatePath);
            html = fs.readFileSync(resourcePath, 'utf-8');
            tempPath = templatePath;
        } catch (error) {}
        if (html) break;
    }
    const resourcePath = path.join(context.extensionPath, tempPath);
    const dirPath = path.dirname(resourcePath);
    html = html.replace(/(<link.+?href="|<script.+?src="|<img.+?src=")(.+?)"/g, (m, $1, $2) => {
        return $1 + vscode.Uri.file(path.resolve(dirPath, $2)).with({ scheme: 'vscode-resource' }).toString() + '"';
    });
    return html;
}

const createSettingPanel = (context) => {
    settingPanel = vscode.window.createWebviewPanel('settingPanel', 'VsBackground', vscode.ViewColumn.One, {
        enableScripts: true,
        retainContextWhenHidden: true,
    });
    settingPanel.iconPath = vscode.Uri.joinPath(context.extensionUri, 'icon.ico');
    settingPanel.webview.html = getWebViewContent(context, ['frontend/index.html','resource/index.html']);
    settingPanel.webview.postMessage({
        data: {
            globalConfig: vscode.workspace.getConfiguration(CONFIG_HEAD, vscode.ConfigurationTarget.Global),
            workspaceConfig: vscode.workspace.getConfiguration(CONFIG_HEAD, vscode.ConfigurationTarget.Workspace),
        },
        type: 'config',
    });
    settingPanel.webview.onDidReceiveMessage(({ command, data }) => {
        if (command === 'saveWorkspaceConfig') {
            vscode.workspace.getConfiguration().update(CONFIG_HEAD, data, vscode.ConfigurationTarget.Workspace);
        } else if (command === 'saveGlobalConfig') {
            vscode.workspace.getConfiguration().update(CONFIG_HEAD, data, vscode.ConfigurationTarget.Global);
        }
    });
    return settingPanel;
};

module.exports = {
    activate(context) {
        // settingPanel
        let settingPanel = null;
        context.subscriptions.push(
            vscode.commands.registerCommand(COMMAND_ID, () => {
                if (!settingPanel) {
                    settingPanel = createSettingPanel(context);
                    settingPanel.onDidDispose(() => (settingPanel = null));
                } else {
                    settingPanel.reveal();
                }
            })
        );

        // statusBar
        const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, -Infinity);
        statusBar.command = COMMAND_ID;
        statusBar.text = '❤️';
        statusBar.tooltip = '打开背景设置页面';
        context.subscriptions.push(statusBar);
        statusBar.show();

        // onDidChangeConfiguration
        vscode.workspace.onDidChangeConfiguration(async () => {
            // 更新css
            await updateCss();
            // 重启
            (await vscode.window.showInformationMessage(vscode.l10n.t('背景配置已更新, 是否需要重启?'), {
                title: '立即重启',
            })) && vscode.commands.executeCommand('workbench.action.reloadWindow');
        });
    },
};
