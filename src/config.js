const path = require('path')
const packageJson = require('../package.json')

module.exports = {
    FIRST_FLAG: true,
    FILE_ENCODING: 'utf-8',
    EXTENSION_NAME : packageJson.displayName,
    CONFIG_HEAD: Object.keys(packageJson.contributes.configuration.properties)[0],
    COMMAND_ID: packageJson.contributes.commands[0].command,
};
