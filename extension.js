// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const cssFilePath = path.join(path.dirname(require.main.filename), 'vs', 'workbench', `workbench.${vscode.env.appHost}.main.css`);
// const product = path.join(path.dirname(require.main.filename), "../", "product.json");
//  同步读取 需要使用一个变量来接收读取出来的数据
// let data = fs.readFileSync(cssFilePath, {
//     encoding: 'utf8', // 指定字符集
//     flag: 'r', // 指定读取的模式  具体上面有
// });
// console.log(data.toString()); // 默认读出来的是buffer类型 使用toString()转为字符串
// fs.writeFileSync(cssFilePath, data.toString() + 123,{});

const config = vscode.workspace.getConfiguration("LifeQuality").get('background');
console.log(config);
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "LifeQuality" is now active!');
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('LifeQuality.helloWorld', function () {
        // The code you place here will be executed every time your command is executed

        // Display a message box to the user
        vscode.window.showInformationMessage('Hello World from LifeQuality!');
    });

    context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
    activate,
    deactivate,
};
