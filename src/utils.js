function runExtensionTask(task, label) {
  Promise.resolve(task).catch((error) => {
    console.error(`[Colin's Theme Switcher] ${label} failed`, error);
  });
}

module.exports = { runExtensionTask };
