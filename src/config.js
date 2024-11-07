const path = require('path')
const packageJson = require('../package.json')

module.exports = {
    FIRST_FLAG_TEMP: path.join(__dirname, './FIRST_FLAG_TEMP.temp'),
    CONFIG_HEAD: Object.keys(packageJson.contributes.configuration.properties)[0],
    COMMAND_ID: packageJson.contributes.commands[0].command,
};
