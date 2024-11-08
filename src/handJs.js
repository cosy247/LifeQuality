const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const { CONFIG_HEAD, FILE_ENCODING } = require('./config');

const disNotification = `
.notification-toast-container:has([aria-label*='installation appears to be corrupt. Please reinstall.']),
.notification-toast-container:has([aria-label*='je pravděpodobně poškozená. Proveďte prosím přeinstalaci.']),
.notification-toast-container:has([aria-label*='Installation ist offenbar beschädigt. Führen Sie eine Neuinstallation durch.']),
.notification-toast-container:has([aria-label*='parece estar dañada. Vuelva a instalar.']),
.notification-toast-container:has([aria-label*='semble être endommagée. Effectuez une réinstallation.']),
.notification-toast-container:has([aria-label*='sembra danneggiata. Reinstallare.']),
.notification-toast-container:has([aria-label*='インストールが壊れている可能性があります。再インストールしてください。']),
.notification-toast-container:has([aria-label*='설치가 손상된 것 같습니다. 다시 설치하세요.']),
.notification-toast-container:has([aria-label*='prawdopodobnie jest uszkodzona. Spróbuj zainstalować ponownie.']),
.notification-toast-container:has([aria-label*='parece estar corrompida. Reinstale-o.']),
.notification-toast-container:has([aria-label*='ïñstællætïøñ æppëærs tø þë çørrµpt. Plëæsë rëïñstæll.']),
.notification-toast-container:has([aria-label*='повреждена. Повторите установку.']),
.notification-toast-container:has([aria-label*='yüklemeniz bozuk gibi görünüyor. Lütfen yeniden yükleyin.']),
.notification-toast-container:has([aria-label*='安裝似乎已損毀。請重新安裝。']),
.notification-toast-container:has([aria-label*='安装似乎损坏。请重新安装。']) { display: none; }`;

const partJs = `
{part}::{after} {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
    background: url({img}) 50%/cover;
    opacity: {opacity};
    pointer-events: none;
    z-index: 999;
}`;

const partNames = ['titlebar', 'banner', 'activitybar', 'sidebar', 'editor', 'panel', 'auxiliarybar', 'statusbar'];

const jsPath = (() => {
    const mainFilename = require.main?.filename;
    const vscodeInstallPath = vscode?.env.appRoot;
    const base = mainFilename?.length ? path.dirname(mainFilename) : path.join(vscodeInstallPath, 'out');
    return path.join(base, 'vs', 'workbench', `workbench.${vscode.env.appHost}.main.js`);
})();

const getJsContent = (clear = false) => {
    const config = vscode.workspace.getConfiguration(CONFIG_HEAD);
    const jsContents = ['{const style = document.createElement("style");style.innerText = `', disNotification];
    if (!clear) {
        if (config.showType === 'full') {
            let jsContent = partJs.replace('{part}', 'body');
            jsContent = jsContent.replace('{after}', 'after');
            jsContent = jsContent.replace('{img}', config.full.img);
            jsContent = jsContent.replace('{opacity}', config.full.opacity);
            jsContents.push(jsContent);
        } else {
            partNames.forEach((partName) => {
                if (!config[partName].img) return;
                let jsContent = partJs.replace('{part}', `#workbench\\\\.parts\\\\.${partName}`);
                jsContent = jsContent.replace('{after}', partName === 'statusbar' ? 'before' : 'after');
                jsContent = jsContent.replace('{img}', config[partName].img);
                jsContent = jsContent.replace('{opacity}', config[partName].opacity);
                jsContents.push(jsContent);
            });
        }
    }
    jsContents.push('`;document.head.appendChild(style);}');
    return jsContents.join(' ').replace(/(\s+|\t|\r|\f|\n)/g, ' ');
};

module.exports = {
    updateJs(clear = false) {
        return new Promise(async (resolve) => {
            let jsContent = (await fs.promises.readFile(jsPath, FILE_ENCODING)).toString();
            jsContent = jsContent.replace(/\n\/\* vsbackground-js-start \*\/[\s\S]*?\/\* vsbackground-js-end \*\//g, '');
            jsContent += '\n/* vsbackground-js-start */';
            jsContent += getJsContent(clear);
            jsContent += '/* vsbackground-js-end */';
            await fs.promises.writeFile(jsPath, jsContent, FILE_ENCODING);
            resolve();
        });
    },
    clearJs() {
        return this.updateJs(true);
    },
};
