import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const expectedName = "theme-reactor";
const expectedCommands = ["theme-reactor.applySeasonalTheme","theme-reactor.applyHolidayTheme","theme-reactor.pickGamingTheme","theme-reactor.pickThemeByPack","theme-reactor.enableLightDarkAutoSwitch","theme-reactor.enableMonthlyAutoTheme","theme-reactor.disableMonthlyAutoTheme","theme-reactor.applyOrangePreset","theme-reactor.applyFocusPreset","theme-reactor.applyLightPreset","theme-reactor.applyGamingPreset","theme-reactor.enableThemeReactor","theme-reactor.disableThemeReactor","theme-reactor.applyThemeReactorNow","theme-reactor.pickReactorFavorite","theme-reactor.randomReactorFavorite","theme-reactor.configureReactorFavorites","theme-reactor.setReactorWorkspaceTheme"];
const files = ["extension.js","src/themeReactor.js","src/themeData.js","src/utils.js"];

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

console.log("Colin's Theme Reactor package check passed.");
