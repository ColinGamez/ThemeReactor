import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const expectedName = "colins-theme-switcher";
const expectedCommands = ["colins-theme-switcher.applySeasonalTheme","colins-theme-switcher.applyHolidayTheme","colins-theme-switcher.pickGamingTheme","colins-theme-switcher.pickThemeByPack","colins-theme-switcher.applyThemeSwitcherNow","colins-theme-switcher.pickSwitcherFavorite","colins-theme-switcher.randomSwitcherFavorite","colins-theme-switcher.configureSwitcherFavorites","colins-theme-switcher.setSwitcherWorkspaceTheme"];
const files = ["extension.js","src/colinsThemeSwitcher.js","src/themeData.js"];

if (pkg.name !== expectedName) {
  throw new Error(`package name must be ${expectedName}`);
}

const contributedCommands = new Set((pkg.contributes?.commands ?? []).map((item) => item.command));
for (const command of expectedCommands) {
  if (!contributedCommands.has(command)) {
    throw new Error(`missing contributed command: ${command}`);
  }
}

for (const file of files) {
  execFileSync(process.execPath, ["--check", file], { stdio: "inherit" });
}

console.log("Colin's Theme Switcher package check passed.");
