const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

const CONFIG_HEAD = 'se';
const COMMAND_ID = 'changeBackground';

const getWebViewContent = (context, templatePath) => {
    const resourcePath = path.join(context.extensionPath, templatePath);
    const dirPath = path.dirname(resourcePath);
    let html = fs.readFileSync(resourcePath, 'utf-8');
    html = html.replace(/(<link.+?href="|<script.+?src="|<img.+?src=")(.+?)"/g, (m, $1, $2) => {
        return $1 + vscode.Uri.file(path.resolve(dirPath, $2)).with({ scheme: 'vscode-resource' }).toString() + '"';
    });
    return html;
};

const changeConfiguration = (path, value, isGlobal) => {
    vscode.workspace.getConfiguration(CONFIG_HEAD).update(path, value, isGlobal);
};

const createSettingPanel = (context) => {
    settingPanel = vscode.window.createWebviewPanel('settingPanel', 'VsBackground', vscode.ViewColumn.One, {
        enableScripts: true,
    });
    settingPanel.iconPath = vscode.Uri.joinPath(context.extensionUri, 'icon.ico');
    settingPanel.webview.html = getWebViewContent(context, 'frontend/index.html');
    settingPanel.webview.postMessage({
        config: vscode.workspace.getConfiguration(CONFIG_HEAD),
        from: 'VsBackground',
    });
    settingPanel.webview.onDidReceiveMessage((message) => {
        console.log('onDidReceiveMessage', message);
    });
    vscode.workspace.onDidChangeConfiguration(() => {
        settingPanel.webview.postMessage({
            config: vscode.workspace.getConfiguration(CONFIG_HEAD),
            from: 'VsBackground',
        });
    });
    return settingPanel;
};

module.exports = {
    activate(context) {
        // vscode.window.showInformationMessage(COMMAND_ID);

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
    },
};
