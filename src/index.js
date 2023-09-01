const BackgroundLifeQuality = require('./BackgroundLifeQuality/index.js');

module.exports = {
    activate(context) {
        BackgroundLifeQuality(context);
    },
    deactivate() {},
};
