const vscode = require("vscode");
const { PACKS, ALL_THEMES } = require("./themeData");
const { runExtensionTask } = require("./utils");

const DEFAULT_REACTOR_SCHEDULE = {
  morning: "Spring Bloom",
  day: "Peach Soda",
  evening: "Summer Sunset",
  night: "All Orange"
};
const DEFAULT_REACTOR_FAVORITES = [
  "All Orange",
  "All Orange High Contrast",
  "Summer Sunset",
  "Autumn Ember",
  "Winter Aurora",
  "Starfighter HUD"
];
const REACTOR_INTERVAL_MS = 5 * 60 * 1000;

function monthTheme(date = new Date()) {
  const month = date.getMonth() + 1;

  if (month >= 3 && month <= 5) {
    return { label: "Spring Bloom", detail: "Spring rotation" };
  }

  if (month >= 6 && month <= 8) {
    return { label: "Summer Sunset", detail: "Summer rotation" };
  }

  if (month >= 9 && month <= 11) {
    return { label: "Autumn Ember", detail: "Autumn rotation" };
  }

  return { label: "Winter Aurora", detail: "Winter rotation" };
}

function holidayTheme(date = new Date()) {
  const month = date.getMonth() + 1;

  if (month === 10) {
    return { label: "Halloween Midnight", detail: "October holiday rotation" };
  }

  if (month === 12) {
    return { label: "Candy Cane Code", detail: "December holiday rotation" };
  }

  if (month === 2) {
    return { label: "Valentine Glow", detail: "February holiday rotation" };
  }

  if (month === 1) {
    return { label: "New Year Neon", detail: "January holiday rotation" };
  }

  return monthTheme(date);
}

function timeBucket(date = new Date()) {
  const hour = date.getHours();

  if (hour >= 5 && hour < 11) {
    return { key: "morning", detail: "morning" };
  }

  if (hour >= 11 && hour < 17) {
    return { key: "day", detail: "day" };
  }

  if (hour >= 17 && hour < 21) {
    return { key: "evening", detail: "evening" };
  }

  return { key: "night", detail: "night" };
}

function isHolidayMonth(date = new Date()) {
  const month = date.getMonth() + 1;
  return month === 1 || month === 2 || month === 10 || month === 12;
}

function safeThemeList(themes, fallback = ALL_THEMES) {
  if (!Array.isArray(themes)) {
    return fallback;
  }

  const normalized = themes.filter((theme) => typeof theme === "string" && theme.trim());
  return normalized.length > 0 ? [...new Set(normalized)] : fallback;
}

function switcherSchedule(config) {
  const schedule = config.get("switcher.schedule", {});

  if (!schedule || typeof schedule !== "object" || Array.isArray(schedule)) {
    return DEFAULT_REACTOR_SCHEDULE;
  }

  return { ...DEFAULT_REACTOR_SCHEDULE, ...schedule };
}

function switcherFavorites(config) {
  return safeThemeList(config.get("switcher.favorites", DEFAULT_REACTOR_FAVORITES), DEFAULT_REACTOR_FAVORITES);
}

function switcherTimeTheme(date = new Date()) {
  const config = vscode.workspace.getConfiguration("colinsThemeSwitcher");
  const schedule = switcherSchedule(config);
  const bucket = timeBucket(date);

  return {
    label: schedule[bucket.key] || DEFAULT_REACTOR_SCHEDULE[bucket.key],
    detail: `${bucket.detail} schedule`
  };
}

function switcherThemeForDate(date = new Date()) {
  const config = vscode.workspace.getConfiguration("colinsThemeSwitcher");
  const rawWorkspaceTheme = config.get("switcher.workspaceTheme", "");
  const workspaceTheme = typeof rawWorkspaceTheme === "string" ? rawWorkspaceTheme.trim() : "";

  if (workspaceTheme) {
    return {
      label: workspaceTheme,
      detail: "workspace theme",
      target: vscode.ConfigurationTarget.Workspace
    };
  }

  const mode = config.get("switcher.mode", "hybrid");

  if (mode === "seasonal") {
    return monthTheme(date);
  }

  if (mode === "holiday") {
    return holidayTheme(date);
  }

  if (mode === "timeOfDay") {
    return switcherTimeTheme(date);
  }

  return isHolidayMonth(date) ? holidayTheme(date) : switcherTimeTheme(date);
}

async function setTheme(label, detail, options = {}) {
  const currentTheme = vscode.workspace.getConfiguration("workbench").get("colorTheme");
  const target = options.target ?? vscode.ConfigurationTarget.Global;

  if (currentTheme === label && !options.force) {
    if (!options.silent) {
      vscode.window.showInformationMessage(`Colin's Theme Switcher: ${label} is already active.`);
    }

    return false;
  }

  await vscode.workspace
    .getConfiguration("workbench")
    .update("colorTheme", label, target);

  if (!options.silent) {
    vscode.window.showInformationMessage(`Colin's Theme Switcher: switched to ${label}${detail ? ` (${detail})` : ""}.`);
  }

  return true;
}

async function updateGlobal(section, key, value) {
  await vscode.workspace
    .getConfiguration(section)
    .update(key, value, vscode.ConfigurationTarget.Global);
}

async function applySettingsPreset({ name, theme, minimap, renderWhitespace }) {
  await updateGlobal("workbench", "colorTheme", theme);
  await updateGlobal("workbench", "iconTheme", "colins-color-icons");
  await updateGlobal("editor", "fontLigatures", true);
  await updateGlobal("editor", "minimap.enabled", minimap);
  await updateGlobal("editor", "bracketPairColorization.enabled", true);
  await updateGlobal("editor", "guides.bracketPairs", "active");
  await updateGlobal("editor", "smoothScrolling", true);
  await updateGlobal("editor", "renderWhitespace", renderWhitespace);
  vscode.window.showInformationMessage(`Colin's Theme Switcher: applied ${name}.`);
}

async function applyOrangePreset() {
  await applySettingsPreset({
    name: "Orange Coding Preset",
    theme: "All Orange",
    minimap: true,
    renderWhitespace: "selection"
  });
}

async function applyFocusPreset() {
  await applySettingsPreset({
    name: "Focus Preset",
    theme: "All Orange High Contrast",
    minimap: false,
    renderWhitespace: "boundary"
  });
}

async function applyLightPreset() {
  await applySettingsPreset({
    name: "Light Coding Preset",
    theme: "Spring Bloom",
    minimap: false,
    renderWhitespace: "selection"
  });
}

async function applyGamingPreset() {
  await applySettingsPreset({
    name: "Gaming Preset",
    theme: "Starfighter HUD",
    minimap: true,
    renderWhitespace: "none"
  });
}

async function applySeasonalTheme() {
  const theme = monthTheme();
  await setTheme(theme.label, theme.detail);
}

async function applyHolidayTheme() {
  const theme = holidayTheme();
  await setTheme(theme.label, theme.detail);
}

async function pickThemeFromPack(packName) {
  const themes = PACKS[packName] ?? [];
  const choice = await vscode.window.showQuickPick(
    themes.map((label) => ({ label, description: packName })),
    { title: `Pick a ${packName} theme`, placeHolder: "Choose a theme" }
  );

  if (choice) {
    await setTheme(choice.label);
  }
}

async function pickThemeByPack() {
  const pack = await vscode.window.showQuickPick(Object.keys(PACKS), {
    title: "Pick a Colin's Theme Switcher pack",
    placeHolder: "Choose a pack"
  });

  if (pack) {
    await pickThemeFromPack(pack);
  }
}

async function enableLightDarkAutoSwitch() {
  await vscode.workspace
    .getConfiguration("window")
    .update("autoDetectColorScheme", true, vscode.ConfigurationTarget.Global);
  await vscode.workspace
    .getConfiguration("workbench")
    .update("preferredLightColorTheme", "Spring Bloom", vscode.ConfigurationTarget.Global);
  await vscode.workspace
    .getConfiguration("workbench")
    .update("preferredDarkColorTheme", "All Orange", vscode.ConfigurationTarget.Global);
  vscode.window.showInformationMessage("Colin's Theme Switcher: enabled VS Code light/dark auto switching.");
}

async function enableMonthlyAutoTheme() {
  await vscode.workspace
    .getConfiguration("colinsThemeSwitcher")
    .update("autoApplyOnStartup", true, vscode.ConfigurationTarget.Global);
  await vscode.workspace
    .getConfiguration("colinsThemeSwitcher")
    .update("autoMode", "seasonal", vscode.ConfigurationTarget.Global);
  await applySeasonalTheme();
}

async function disableMonthlyAutoTheme() {
  await vscode.workspace
    .getConfiguration("colinsThemeSwitcher")
    .update("autoApplyOnStartup", false, vscode.ConfigurationTarget.Global);
  vscode.window.showInformationMessage("Colin's Theme Switcher: startup auto theme is off.");
}

async function applyThemeSwitcher(options = {}) {
  const theme = switcherThemeForDate();
  return setTheme(theme.label, `Theme Switcher ${theme.detail}`, {
    ...options,
    target: theme.target ?? options.target
  });
}

async function applyThemeSwitcherIfEnabled(options = {}) {
  const config = vscode.workspace.getConfiguration("colinsThemeSwitcher");

  if (!config.get("switcher.enabled", false)) {
    return false;
  }

  return applyThemeSwitcher(options);
}

async function enableThemeSwitcher() {
  const config = vscode.workspace.getConfiguration("colinsThemeSwitcher");
  await config.update("switcher.enabled", true, vscode.ConfigurationTarget.Global);

  if (!config.get("switcher.mode")) {
    await config.update("switcher.mode", "hybrid", vscode.ConfigurationTarget.Global);
  }

  const changed = await applyThemeSwitcher({ silent: true });
  const theme = switcherThemeForDate();
  vscode.window.showInformationMessage(
    `Colin's Theme Switcher is on: ${theme.label}${changed ? "" : " was already active"}.`
  );
}

async function disableThemeSwitcher() {
  await vscode.workspace
    .getConfiguration("colinsThemeSwitcher")
    .update("switcher.enabled", false, vscode.ConfigurationTarget.Global);
  vscode.window.showInformationMessage("Colin's Theme Switcher is off.");
}

async function applyThemeSwitcherNow() {
  await applyThemeSwitcher();
}

async function pickSwitcherFavorite() {
  const config = vscode.workspace.getConfiguration("colinsThemeSwitcher");
  const themes = switcherFavorites(config);
  const choice = await vscode.window.showQuickPick(
    themes.map((label) => ({ label, description: "Theme Switcher favorite" })),
    { title: "Pick a Theme Switcher favorite", placeHolder: "Choose a favorite theme" }
  );

  if (choice) {
    await setTheme(choice.label, "Theme Switcher favorite");
  }
}

async function randomSwitcherFavorite() {
  const config = vscode.workspace.getConfiguration("colinsThemeSwitcher");
  const themes = switcherFavorites(config);
  const label = themes[Math.floor(Math.random() * themes.length)];
  await setTheme(label, "Theme Switcher random favorite");
}

async function configureSwitcherFavorites() {
  const config = vscode.workspace.getConfiguration("colinsThemeSwitcher");
  const favorites = new Set(switcherFavorites(config));
  const choices = await vscode.window.showQuickPick(
    ALL_THEMES.map((label) => ({
      label,
      picked: favorites.has(label)
    })),
    {
      canPickMany: true,
      title: "Configure Theme Switcher favorites",
      placeHolder: "Pick themes for random/favorite commands"
    }
  );

  if (!choices) {
    return;
  }

  await config.update(
    "switcher.favorites",
    choices.map((choice) => choice.label),
    vscode.ConfigurationTarget.Global
  );
  vscode.window.showInformationMessage(`Colin's Theme Switcher: saved ${choices.length} favorites.`);
}

async function setSwitcherWorkspaceTheme() {
  if (!vscode.workspace.workspaceFolders?.length) {
    vscode.window.showWarningMessage("Open a workspace or folder before setting a Theme Switcher workspace theme.");
    return;
  }

  const choices = [
    { label: "Clear workspace theme", description: "Use the normal Theme Switcher mode", theme: "" },
    ...ALL_THEMES.map((label) => ({ label, description: "Use in this workspace", theme: label }))
  ];
  const choice = await vscode.window.showQuickPick(choices, {
    title: "Set Theme Switcher workspace theme",
    placeHolder: "Choose the theme this workspace should use"
  });

  if (!choice) {
    return;
  }

  await vscode.workspace
    .getConfiguration("colinsThemeSwitcher")
    .update("switcher.workspaceTheme", choice.theme, vscode.ConfigurationTarget.Workspace);

  if (!choice.theme) {
    vscode.window.showInformationMessage("Colin's Theme Switcher: cleared this workspace theme.");
    return;
  }

  await setTheme(choice.theme, "Theme Switcher workspace theme", {
    force: true,
    target: vscode.ConfigurationTarget.Workspace
  });
}

async function applyConfiguredStartupTheme() {
  const config = vscode.workspace.getConfiguration("colinsThemeSwitcher");

  if (config.get("switcher.enabled", false)) {
    await applyThemeSwitcher({ silent: true });
    return;
  }

  if (!config.get("autoApplyOnStartup")) {
    return;
  }

  if (config.get("autoMode") === "holiday") {
    await applyHolidayTheme();
    return;
  }

  await applySeasonalTheme();
}

function watchThemeSwitcher(context) {
  const timer = setInterval(() => {
    runExtensionTask(applyThemeSwitcherIfEnabled({ silent: true }), "Theme Switcher interval update");
  }, REACTOR_INTERVAL_MS);

  context.subscriptions.push({ dispose: () => clearInterval(timer) });
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("colinsThemeSwitcher.switcher")) {
        runExtensionTask(applyThemeSwitcherIfEnabled({ silent: true }), "Theme Switcher configuration update");
      }
    })
  );
}

function registerThemeSwitcher(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand("colins-theme-switcher.applySeasonalTheme", applySeasonalTheme),
    vscode.commands.registerCommand("colins-theme-switcher.applyHolidayTheme", applyHolidayTheme),
    vscode.commands.registerCommand("colins-theme-switcher.pickGamingTheme", () => pickThemeFromPack("Gaming")),
    vscode.commands.registerCommand("colins-theme-switcher.pickThemeByPack", pickThemeByPack),
    vscode.commands.registerCommand("colins-theme-switcher.enableLightDarkAutoSwitch", enableLightDarkAutoSwitch),
    vscode.commands.registerCommand("colins-theme-switcher.enableMonthlyAutoTheme", enableMonthlyAutoTheme),
    vscode.commands.registerCommand("colins-theme-switcher.disableMonthlyAutoTheme", disableMonthlyAutoTheme),
    vscode.commands.registerCommand("colins-theme-switcher.applyOrangePreset", applyOrangePreset),
    vscode.commands.registerCommand("colins-theme-switcher.applyFocusPreset", applyFocusPreset),
    vscode.commands.registerCommand("colins-theme-switcher.applyLightPreset", applyLightPreset),
    vscode.commands.registerCommand("colins-theme-switcher.applyGamingPreset", applyGamingPreset),
    vscode.commands.registerCommand("colins-theme-switcher.enableThemeSwitcher", enableThemeSwitcher),
    vscode.commands.registerCommand("colins-theme-switcher.disableThemeSwitcher", disableThemeSwitcher),
    vscode.commands.registerCommand("colins-theme-switcher.applyThemeSwitcherNow", applyThemeSwitcherNow),
    vscode.commands.registerCommand("colins-theme-switcher.pickSwitcherFavorite", pickSwitcherFavorite),
    vscode.commands.registerCommand("colins-theme-switcher.randomSwitcherFavorite", randomSwitcherFavorite),
    vscode.commands.registerCommand("colins-theme-switcher.configureSwitcherFavorites", configureSwitcherFavorites),
    vscode.commands.registerCommand("colins-theme-switcher.setSwitcherWorkspaceTheme", setSwitcherWorkspaceTheme)
  );

  watchThemeSwitcher(context);

  setTimeout(() => {
    runExtensionTask(applyConfiguredStartupTheme(), "startup theme apply");
  }, 1200);
}

module.exports = { registerThemeSwitcher };
