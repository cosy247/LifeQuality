const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

const { CONFIG_HEAD, COMMAND_ID, EXTENSION_NAME, FILE_ENCODING, FIRST_FLAG } = require('./config');
const { updateJs, clearJs } = require('./handJs');

const getWebViewContent = (context, templatePath) => {
    const resourcePath = path.join(context.extensionPath, templatePath);
    let html = fs.readFileSync(resourcePath, FILE_ENCODING);
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
    settingPanel.iconPath = vscode.Uri.joinPath(context.extensionUri, 'assets/icon.ico');
    settingPanel.webview.html = getWebViewContent(context, 'frontend/index.html');
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

const changeFirstFlag = async () => {
    // 修改配置
    const configJsPath = path.join(__dirname, 'config.js');
    const configJs = await fs.promises.readFile(configJsPath, FILE_ENCODING);
    fs.promises.writeFile(configJsPath, configJs.replace('FIRST_FLAG: true', 'FIRST_FLAG: false'), FILE_ENCODING);
    // 更新js
    await updateJs();
    // 重启
    (await vscode.window.showInformationMessage(`${EXTENSION_NAME}: 插件首次加载成功, 历史配置重启后生效。`, {
        title: '立即重启',
    })) && vscode.commands.executeCommand('workbench.action.reloadWindow');
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
        vscode.workspace.onDidChangeConfiguration(async (event) => {
            if (!event.affectsConfiguration(CONFIG_HEAD)) return;
            // 更新js
            await updateJs();
            // 重启
            (await vscode.window.showInformationMessage('背景配置已更新, 重启后生效。', {
                title: '立即重启',
            })) && vscode.commands.executeCommand('workbench.action.reloadWindow');
        });

        // 是否为第一次
        FIRST_FLAG && changeFirstFlag();
    },
    async deactivate() {
        // 更新js
        await clearJs();
        // 重启
        (await vscode.window.showInformationMessage(`${EXTENSION_NAME}: 插件卸载成功, 重启后清理修改。`, {
            title: '立即重启',
        })) && vscode.commands.executeCommand('workbench.action.reloadWindow');
    },
};
