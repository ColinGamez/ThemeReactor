const { registerThemeSwitcher } = require("./src/colinsThemeSwitcher");

function activate(context) {
  registerThemeSwitcher(context);
}

function deactivate() {}

module.exports = { activate, deactivate };
