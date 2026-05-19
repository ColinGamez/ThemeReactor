const { registerThemeReactor } = require("./src/themeReactor");

function activate(context) {
  registerThemeReactor(context);
}

function deactivate() {}

module.exports = { activate, deactivate };
