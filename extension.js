const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

const backgroundFileName = `workbench.${vscode.env.appHost}.background.css`;
const importStyleString = `@import url("./${backgroundFileName}");`;
const partNames = ['titlebar', 'banner', 'activitybar', 'sidebar', 'editor', 'panel', 'auxiliarybar', 'statusbar'];
const styleFilePath = path.join(path.dirname(require.main.filename), 'vs', 'workbench', `workbench.${vscode.env.appHost}.main.css`);
const backgroundFilePath = path.join(path.dirname(require.main.filename), 'vs', 'workbench', backgroundFileName);

function getBackgroundStyle() {
  const config = vscode.workspace.getConfiguration('se').get('background');
  if (config.showType == 'fullScreen') {
    return `
      body::after {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        display: block;
        width: 100%;
        height: 100%;
        background: url(${config.fullScreen.imgUrl}) 50% 50%/cover;
        opacity: ${config.fullScreen.opacity};
        pointer-events: none;
        z-index: 999;
      }
    `;
  } else if (config.showType == 'partition') {
    return partNames.reduce(
      (partitionStyle, partName) =>
        partitionStyle +
        (config[partName].imgUrl
          ? `
            [id='workbench.parts.${partName}']::after {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              display: block;
              width: 100%;
              height: 100%;
              background: url(${config[partName].imgUrl}) 50% 50%/cover;
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

module.exports = {
  activate(context) {
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(replaceStyle));
    replaceStyle();
  },
};
