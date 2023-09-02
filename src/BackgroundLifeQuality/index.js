const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

const styleStartLabel = 'LifeQuality-background-start';
const styleEndLabel = 'LifeQuality-background-end';
const styleRegExp = new RegExp(`/\\* ${styleStartLabel} \\*/[\\s\\S]*/\\* ${styleEndLabel} \\*/`, 'g');
const partNames = ['titlebar','banner','activitybar','sidebar','editor','panel','auxiliarybar','statusbar']
const styleFilePath = path.join(path.dirname(require.main.filename), 'vs', 'workbench', `workbench.${vscode.env.appHost}.main.css`);

function getBackgroundStyle(config) {
    if (config.showType == 'fullScreen') {
        const { imgUrl, opacity } = config.fullScreen;
        return `/* ${styleStartLabel} */
            body::after {
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
        /* ${styleEndLabel} */`.replace(/\s+/g, ' ');
    } else if(config.showType == 'partition') {
        const partitionStyle =  partNames.reduce((partitionStyle, partName) => {
            console.log(config,partName, config[partName], config[partName].imgUrl);
            return partitionStyle + (config[partName].imgUrl ? `[id='workbench.parts.${partName}']::after {
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
            }` : '');
        }, '');
        return `/* ${styleStartLabel} */
            ${partitionStyle}
        /* ${styleEndLabel} */`.replace(/\s+/g, ' ');
    }
}
function replaceStyle(config) {
    const styleData = fs.readFileSync(styleFilePath, { encoding: 'utf8', flag: 'r' }).toString();
    const newStyleData = styleData.replace(styleRegExp, '') + getBackgroundStyle(config);
    fs.writeFileSync(styleFilePath, newStyleData, {});
}

function clearStyle() {
    const styleData = fs.readFileSync(styleFilePath, { encoding: 'utf8', flag: 'r' }).toString();
    const newStyleData = styleData.replace(styleRegExp, '');
    fs.writeFileSync(styleFilePath, newStyleData, {});
}

module.exports = (context) => {
    vscode.workspace.onDidChangeConfiguration(() => {
        const config = vscode.workspace.getConfiguration('LifeQuality').get('background');
        if (config.isOpened) {
            replaceStyle(config);
        } else {
            clearStyle();
        }
    });
};
