const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

const backgroundFileName = `workbench.${vscode.env.appHost}.background.css`;
const importStyleString = `@import url("./${backgroundFileName}");`;
const partNames = ['titlebar', 'banner', 'activitybar', 'sidebar', 'editor', 'panel', 'auxiliarybar', 'statusbar'];
const styleFilePath = path.join(
  path.dirname(require.main.filename),
  'vs',
  'workbench',
  `workbench.${vscode.env.appHost}.main.css`
);
const backgroundFilePath = path.join(path.dirname(require.main.filename), 'vs', 'workbench', backgroundFileName);

function getBackgroundStyle() {
  const config = vscode.workspace.getConfiguration('se').get('background');
  if (config.showType == 'full') {
    return `
      body::after {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        display: block;
        width: 100%;
        height: 100%;
        background: url(${config.full.img}) 50% 50%/cover;
        opacity: ${config.full.opacity};
        pointer-events: none;
        z-index: 999;
      }
    `;
  } else if (config.showType == 'partition') {
    return partNames.reduce(
      (partitionStyle, partName) =>
        partitionStyle +
        (config[partName].img
          ? `
            [id='workbench.parts.${partName}']::after {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              display: block;
              width: 100%;
              height: 100%;
              background: url(${config[partName].img}) 50% 50%/cover;
              opacity: ${config[partName].opacity};
              pointer-events: none;
              z-index: 999;
            }
          `
          : ''),
      ''
    );
  } else {
    return '';
  }
}

function replaceStyle() {
  fs.readFile(styleFilePath, { encoding: 'utf8' }, (_, data) => {
    if (!data.startsWith(importStyleString)) {
      fs.writeFile(styleFilePath, importStyleString + data, { encoding: 'utf8' }, () => {});
    }
    fs.writeFile(backgroundFilePath, getBackgroundStyle().replace(/[\r\n\s]+/g, ' '), { encoding: 'utf8' }, () => {});
  });
}

function updateStatusBarItem() {
  const n = getNumberOfSelectedLines(vscode.window.activeTextEditor);
  if (n > 0) {
    myStatusBarItem.text = `$(megaphone) ${n} line(s) selected`;
    myStatusBarItem.show();
  } else {
    myStatusBarItem.hide();
  }
}

function getNumberOfSelectedLines(editor) {
  let lines = 0;
  if (editor) {
    lines = editor.selections.reduce((prev, curr) => prev + (curr.end.line - curr.start.line), 0);
  }
  return lines;
}

module.exports = {
  activate(context) {
    // register a command that is invoked when the status bar
    // item is selected
    const myCommandId = 'sample.showSelectionCount';
    subscriptions.push(
      vscode.commands.registerCommand(myCommandId, () => {
        const n = getNumberOfSelectedLines(vscode.window.activeTextEditor);
        vscode.window.showInformationMessage(`Yeah, ${n} line(s) selected... Keep going!`);
      })
    );

    // create a new status bar item that we can now manage
    myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    myStatusBarItem.command = myCommandId;
    subscriptions.push(myStatusBarItem);

    // register some listener that make sure the status bar
    // item always up-to-date
    subscriptions.push(vscode.window.onDidChangeActiveTextEditor(updateStatusBarItem));
    subscriptions.push(vscode.window.onDidChangeTextEditorSelection(updateStatusBarItem));

    // update status bar item once at start
    updateStatusBarItem();

    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(replaceStyle));
    replaceStyle();
  },
};
