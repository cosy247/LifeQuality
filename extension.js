const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

const styleStartLabel = 'LifeQuality-background-start';
const styleEndLabel = 'LifeQuality-background-end';
const styleRegExp = new RegExp(`/\\* ${styleStartLabel} \\*/[\\s\\S]*/\\* ${styleEndLabel} \\*/`, 'g');
const partNames = ['titlebar', 'banner', 'activitybar', 'sidebar', 'editor', 'panel', 'auxiliarybar', 'statusbar'];
const styleFilePath = path.join(path.dirname(require.main.filename), 'vs', 'workbench', `workbench.${vscode.env.appHost}.main.css`);

function getBackgroundStyle() {
  const config = vscode.workspace.getConfiguration('se').get('background');
  if (config.showType == 'fullScreen') {
    return `/* ${styleStartLabel} */
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
    /* ${styleEndLabel} */`.replace(/\s+/g, ' ');
  } else if (config.showType == 'partition') {
    const partitionStyle = partNames.reduce((partitionStyle, partName) => {
      return (
        partitionStyle +
        (config[partName].imgUrl
          ? `[id='workbench.parts.${partName}']::after {
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
            }`
          : '')
      );
    }, '');
    return `/* ${styleStartLabel} */
      ${partitionStyle}
    /* ${styleEndLabel} */`.replace(/\s+/g, ' ');
  } else {
    return '';
  }
}

function replaceStyle() {
  fs.readFile(styleFilePath, { encoding: 'utf8' }, (_, data) => {
    const newStyleData = data.replace(styleRegExp, '') + getBackgroundStyle();
    fs.writeFile(styleFilePath, newStyleData, { encoding: 'utf8' }, () => {});
  });
}

function clearStyle() {
  fs.readFile(styleFilePath, 'utf8').then((_, data) => {
    const newStyleData = data.replace(styleRegExp, '');
    fs.writeFile(styleFilePath, newStyleData, { encoding: 'utf8' }, () => {});
  });
}

module.exports = {
  activate(context) {
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(replaceStyle));
    replaceStyle();
  },
  deactivate() {
    clearStyle();
  },
};
