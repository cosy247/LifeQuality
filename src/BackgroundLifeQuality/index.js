const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

const styleStartLabel = 'LifeQuality-background-start';
const styleEndLabel = 'LifeQuality-background-end';
const styleFilePath = path.join(path.dirname(require.main.filename), 'vs', 'workbench', `workbench.${vscode.env.appHost}.main.css`);

function getBackgroundStyle(config) {
    const {
        all: { showType },
    } = config;
    if (showType == 'fullScreen') {
        const {
            fullScreen: { imgUrls, selectType, opacity },
        } = config;
        if(selectType == 'random') {
            
        }
        return `/* ${styleStartLabel} */
            body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            display: block;
            width: 100%;
            height: 100%;
            background: url(${imgUrl}) 50% 50%/cover;
            opacity: ${opacity};
            pointer-events: none;
            z-index: 999;
            }
        /* ${styleEndLabel} */`.replace(/\s+/g, '');
    }
}

function clearStyle() {
    const styleData = fs.readFileSync(styleFilePath, { encoding: 'utf8', flag: 'r' }).toString();
    const newStyleData = styleData.replace(new RegExp(`/\\* ${styleStartLabel} \\*/[\\s\\S]*/\\* ${styleEndLabel} \\*/`, 'g'), '');
    fs.writeFileSync(styleFilePath, newStyleData, {});
}

function replaceStyle(config) {
    const styleData = fs.readFileSync(styleFilePath, { encoding: 'utf8', flag: 'r' }).toString();
    const newStyleData = styleData.replace(new RegExp(`/\\* ${styleStartLabel} \\*/[\\s\\S]*/\\* ${styleEndLabel} \\*/`, 'g'), '') + getBackgroundStyle(config);
    fs.writeFileSync(styleFilePath, newStyleData, {});
}

module.exports = (context) => {
    vscode.workspace.onDidChangeConfiguration(() => {
        const config = vscode.workspace.getConfiguration('LifeQuality').get('background');
        if (config.all.isOpened) {
            replaceStyle(config);
        } else {
            clearStyle();
        }
    });
};
