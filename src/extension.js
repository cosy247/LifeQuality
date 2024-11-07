const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

const { CONFIG_HEAD, COMMAND_ID, FIRST_FLAG_TEMP } = require('./config');
const { updateJs } = require('./handJs');

const getWebViewContent = (context, templatePaths) => {
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
};

const createSettingPanel = (context) => {
    settingPanel = vscode.window.createWebviewPanel('settingPanel', 'VsBackground', vscode.ViewColumn.One, {
        enableScripts: true,
        retainContextWhenHidden: true,
    });
    settingPanel.iconPath = vscode.Uri.joinPath(context.extensionUri, 'icon.ico');
    settingPanel.webview.html = getWebViewContent(context, ['frontend/frontend.html', 'frontend.html']);
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
    async activate(context) {
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
        vscode.workspace.onDidChangeConfiguration(async (event) => {
            if (!event.affectsConfiguration(CONFIG_HEAD)) return;
            // 更新js
            await updateJs();
            // 重启
            (await vscode.window.showInformationMessage('背景配置已更新, 重启后生效?', {
                title: '立即重启',
            })) && vscode.commands.executeCommand('workbench.action.reloadWindow');
        });

        // 检查是否为第一次
        fs.promises.access(FIRST_FLAG_TEMP).catch(async () => {
            await fs.promises.writeFile(FIRST_FLAG_TEMP, 'FIRST_FLAG_TEMP');
            // 更新js
            await updateJs();
            // 重启
            (await vscode.window.showInformationMessage('插件加载成功, 重启后生效?', {
                title: '立即重启',
            })) && vscode.commands.executeCommand('workbench.action.reloadWindow');
        });
    },
};
