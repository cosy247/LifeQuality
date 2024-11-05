const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

const CONFIG_HEAD = 'vsbackground';
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

const createSettingPanel = (context) => {
    settingPanel = vscode.window.createWebviewPanel('settingPanel', 'VsBackground', vscode.ViewColumn.One, {
        enableScripts: true,
        retainContextWhenHidden: true,
    });
    settingPanel.iconPath = vscode.Uri.joinPath(context.extensionUri, 'icon.ico');
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

const base = (() => {
    const mainFilename = require.main?.filename;
    const vscodeInstallPath = vscode?.env.appRoot;
    const base = mainFilename?.length ? path.dirname(mainFilename) : path.join(vscodeInstallPath, 'out');
    return base;
})();

const jsPath = (() => {
    if (vscode.env.appHost === 'desktop') {
        return path.join(base, 'vs', 'workbench', 'workbench.desktop.main.js');
    }
    return path.join(base, 'vs', 'workbench', 'workbench.web.main.js');
})();

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

        // onDidChangeConfiguration
        vscode.workspace.onDidChangeConfiguration(() => {
            const fileStream = fs.createReadStream(filePath);
            readline
                .createInterface({
                    input: fileStream,
                    crlfDelay: Infinity, // 识别Windows风格的行结束符\r\n
                })
                .on('line', (line) => {
                    // 在这里处理每行数据
                    console.log(line);
                    // 可以根据需要对line进行解析或进一步处理
                });

            // settingPanel.webview.postMessage({
            //     data: settingConfig,
            //     type: 'config',
            // });
        });
    },
};
