const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

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

const partCss = `
{part}::after {
	content: '';
	position: absolute;
	left: 0;
	top: 0;
	right: 0;
	bottom: 0;
	background: url({img}) 50%/cover;
	opacity: {opacity};
	pointer-events: none;
	z-index: 999;
}`;

const CONFIG_HEAD = 'vsbackground';

const partNames = ['titlebar', 'banner', 'activitybar', 'sidebar', 'editor', 'panel', 'auxiliarybar', 'statusbar'];

const getJsContent = () => {
    const config = vscode.workspace.getConfiguration(CONFIG_HEAD);
    const cssContents = [disNotification];
    if (config.showType === 'full') {
        let cssContent = partCss.replace('{part}', 'body');
        cssContent = cssContent.replace('{img}', config.full.img);
        cssContent = cssContent.replace('{opacity}', config.full.opacity);
        cssContents.push(cssContent);
    } else {
        partNames.forEach((partName) => {
            if (!config[partName].img) return;
            let cssContent = partCss.replace('{part}', `workbench\\.parts\\.${partName}`);
            cssContent = cssContent.replace('{img}', config[partName].img);
            cssContent = cssContent.replace('{opacity}', config[partName].opacity);
            cssContents.push(cssContent);
        });
    }
    return cssContents.join(' ');
};

module.exports = async function updateCss() {
    const mainFilename = require.main?.filename;
    const vscodeInstallPath = vscode?.env.appRoot;
    const base = mainFilename?.length ? path.dirname(mainFilename) : path.join(vscodeInstallPath, 'out');
    const cssPath = path.join(base, 'vs', 'workbench', `workbench.${vscode.env.appHost}.main.css`);
    let cssContent = await fs.promises.readFile(cssPath, { encoding: 'utf8' });
    cssContent = cssContent.replace(/\/\* vsbackground-js-start \*\/[\s\S]*?\/\* vsbackground-js-end \*\//g, '');
    cssContent += '/* vsbackground-js-start */';
    cssContent += getJsContent();
    cssContent += '/* vsbackground-js-end */';
    await fs.promises.writeFile(cssPath, cssContent);
};
