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

function reactorSchedule(config) {
  const schedule = config.get("reactor.schedule", {});

  if (!schedule || typeof schedule !== "object" || Array.isArray(schedule)) {
    return DEFAULT_REACTOR_SCHEDULE;
  }

  return { ...DEFAULT_REACTOR_SCHEDULE, ...schedule };
}

function reactorFavorites(config) {
  return safeThemeList(config.get("reactor.favorites", DEFAULT_REACTOR_FAVORITES), DEFAULT_REACTOR_FAVORITES);
}

function reactorTimeTheme(date = new Date()) {
  const config = vscode.workspace.getConfiguration("themeReactor");
  const schedule = reactorSchedule(config);
  const bucket = timeBucket(date);

  return {
    label: schedule[bucket.key] || DEFAULT_REACTOR_SCHEDULE[bucket.key],
    detail: `${bucket.detail} schedule`
  };
}

function reactorThemeForDate(date = new Date()) {
  const config = vscode.workspace.getConfiguration("themeReactor");
  const rawWorkspaceTheme = config.get("reactor.workspaceTheme", "");
  const workspaceTheme = typeof rawWorkspaceTheme === "string" ? rawWorkspaceTheme.trim() : "";

  if (workspaceTheme) {
    return {
      label: workspaceTheme,
      detail: "workspace theme",
      target: vscode.ConfigurationTarget.Workspace
    };
  }

  const mode = config.get("reactor.mode", "hybrid");

  if (mode === "seasonal") {
    return monthTheme(date);
  }

  if (mode === "holiday") {
    return holidayTheme(date);
  }

  if (mode === "timeOfDay") {
    return reactorTimeTheme(date);
  }

  return isHolidayMonth(date) ? holidayTheme(date) : reactorTimeTheme(date);
}

async function setTheme(label, detail, options = {}) {
  const currentTheme = vscode.workspace.getConfiguration("workbench").get("colorTheme");
  const target = options.target ?? vscode.ConfigurationTarget.Global;

  if (currentTheme === label && !options.force) {
    if (!options.silent) {
      vscode.window.showInformationMessage(`Colin's Theme Reactor: ${label} is already active.`);
    }

    return false;
  }

  await vscode.workspace
    .getConfiguration("workbench")
    .update("colorTheme", label, target);

  if (!options.silent) {
    vscode.window.showInformationMessage(`Colin's Theme Reactor: switched to ${label}${detail ? ` (${detail})` : ""}.`);
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
  vscode.window.showInformationMessage(`Colin's Theme Reactor: applied ${name}.`);
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
    title: "Pick a Colin's Theme Reactor pack",
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
  vscode.window.showInformationMessage("Colin's Theme Reactor: enabled VS Code light/dark auto switching.");
}

async function enableMonthlyAutoTheme() {
  await vscode.workspace
    .getConfiguration("themeReactor")
    .update("autoApplyOnStartup", true, vscode.ConfigurationTarget.Global);
  await vscode.workspace
    .getConfiguration("themeReactor")
    .update("autoMode", "seasonal", vscode.ConfigurationTarget.Global);
  await applySeasonalTheme();
}

async function disableMonthlyAutoTheme() {
  await vscode.workspace
    .getConfiguration("themeReactor")
    .update("autoApplyOnStartup", false, vscode.ConfigurationTarget.Global);
  vscode.window.showInformationMessage("Colin's Theme Reactor: startup auto theme is off.");
}

async function applyThemeReactor(options = {}) {
  const theme = reactorThemeForDate();
  return setTheme(theme.label, `Theme Reactor ${theme.detail}`, {
    ...options,
    target: theme.target ?? options.target
  });
}

async function applyThemeReactorIfEnabled(options = {}) {
  const config = vscode.workspace.getConfiguration("themeReactor");

  if (!config.get("reactor.enabled", false)) {
    return false;
  }

  return applyThemeReactor(options);
}

async function enableThemeReactor() {
  const config = vscode.workspace.getConfiguration("themeReactor");
  await config.update("reactor.enabled", true, vscode.ConfigurationTarget.Global);

  if (!config.get("reactor.mode")) {
    await config.update("reactor.mode", "hybrid", vscode.ConfigurationTarget.Global);
  }

  const changed = await applyThemeReactor({ silent: true });
  const theme = reactorThemeForDate();
  vscode.window.showInformationMessage(
    `Colin's Theme Reactor is on: ${theme.label}${changed ? "" : " was already active"}.`
  );
}

async function disableThemeReactor() {
  await vscode.workspace
    .getConfiguration("themeReactor")
    .update("reactor.enabled", false, vscode.ConfigurationTarget.Global);
  vscode.window.showInformationMessage("Colin's Theme Reactor is off.");
}

async function applyThemeReactorNow() {
  await applyThemeReactor();
}

async function pickReactorFavorite() {
  const config = vscode.workspace.getConfiguration("themeReactor");
  const themes = reactorFavorites(config);
  const choice = await vscode.window.showQuickPick(
    themes.map((label) => ({ label, description: "Theme Reactor favorite" })),
    { title: "Pick a Theme Reactor favorite", placeHolder: "Choose a favorite theme" }
  );

  if (choice) {
    await setTheme(choice.label, "Theme Reactor favorite");
  }
}

async function randomReactorFavorite() {
  const config = vscode.workspace.getConfiguration("themeReactor");
  const themes = reactorFavorites(config);
  const label = themes[Math.floor(Math.random() * themes.length)];
  await setTheme(label, "Theme Reactor random favorite");
}

async function configureReactorFavorites() {
  const config = vscode.workspace.getConfiguration("themeReactor");
  const favorites = new Set(reactorFavorites(config));
  const choices = await vscode.window.showQuickPick(
    ALL_THEMES.map((label) => ({
      label,
      picked: favorites.has(label)
    })),
    {
      canPickMany: true,
      title: "Configure Theme Reactor favorites",
      placeHolder: "Pick themes for random/favorite commands"
    }
  );

  if (!choices) {
    return;
  }

  await config.update(
    "reactor.favorites",
    choices.map((choice) => choice.label),
    vscode.ConfigurationTarget.Global
  );
  vscode.window.showInformationMessage(`Colin's Theme Reactor: saved ${choices.length} favorites.`);
}

async function setReactorWorkspaceTheme() {
  if (!vscode.workspace.workspaceFolders?.length) {
    vscode.window.showWarningMessage("Open a workspace or folder before setting a Theme Reactor workspace theme.");
    return;
  }

  const choices = [
    { label: "Clear workspace theme", description: "Use the normal Theme Reactor mode", theme: "" },
    ...ALL_THEMES.map((label) => ({ label, description: "Use in this workspace", theme: label }))
  ];
  const choice = await vscode.window.showQuickPick(choices, {
    title: "Set Theme Reactor workspace theme",
    placeHolder: "Choose the theme this workspace should use"
  });

  if (!choice) {
    return;
  }

  await vscode.workspace
    .getConfiguration("themeReactor")
    .update("reactor.workspaceTheme", choice.theme, vscode.ConfigurationTarget.Workspace);

  if (!choice.theme) {
    vscode.window.showInformationMessage("Colin's Theme Reactor: cleared this workspace theme.");
    return;
  }

  await setTheme(choice.theme, "Theme Reactor workspace theme", {
    force: true,
    target: vscode.ConfigurationTarget.Workspace
  });
}

async function applyConfiguredStartupTheme() {
  const config = vscode.workspace.getConfiguration("themeReactor");

  if (config.get("reactor.enabled", false)) {
    await applyThemeReactor({ silent: true });
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

function watchThemeReactor(context) {
  const timer = setInterval(() => {
    runExtensionTask(applyThemeReactorIfEnabled({ silent: true }), "Theme Reactor interval update");
  }, REACTOR_INTERVAL_MS);

  context.subscriptions.push({ dispose: () => clearInterval(timer) });
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("themeReactor.reactor")) {
        runExtensionTask(applyThemeReactorIfEnabled({ silent: true }), "Theme Reactor configuration update");
      }
    })
  );
}

function registerThemeReactor(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand("theme-reactor.applySeasonalTheme", applySeasonalTheme),
    vscode.commands.registerCommand("theme-reactor.applyHolidayTheme", applyHolidayTheme),
    vscode.commands.registerCommand("theme-reactor.pickGamingTheme", () => pickThemeFromPack("Gaming")),
    vscode.commands.registerCommand("theme-reactor.pickThemeByPack", pickThemeByPack),
    vscode.commands.registerCommand("theme-reactor.enableLightDarkAutoSwitch", enableLightDarkAutoSwitch),
    vscode.commands.registerCommand("theme-reactor.enableMonthlyAutoTheme", enableMonthlyAutoTheme),
    vscode.commands.registerCommand("theme-reactor.disableMonthlyAutoTheme", disableMonthlyAutoTheme),
    vscode.commands.registerCommand("theme-reactor.applyOrangePreset", applyOrangePreset),
    vscode.commands.registerCommand("theme-reactor.applyFocusPreset", applyFocusPreset),
    vscode.commands.registerCommand("theme-reactor.applyLightPreset", applyLightPreset),
    vscode.commands.registerCommand("theme-reactor.applyGamingPreset", applyGamingPreset),
    vscode.commands.registerCommand("theme-reactor.enableThemeReactor", enableThemeReactor),
    vscode.commands.registerCommand("theme-reactor.disableThemeReactor", disableThemeReactor),
    vscode.commands.registerCommand("theme-reactor.applyThemeReactorNow", applyThemeReactorNow),
    vscode.commands.registerCommand("theme-reactor.pickReactorFavorite", pickReactorFavorite),
    vscode.commands.registerCommand("theme-reactor.randomReactorFavorite", randomReactorFavorite),
    vscode.commands.registerCommand("theme-reactor.configureReactorFavorites", configureReactorFavorites),
    vscode.commands.registerCommand("theme-reactor.setReactorWorkspaceTheme", setReactorWorkspaceTheme)
  );

  watchThemeReactor(context);

  setTimeout(() => {
    runExtensionTask(applyConfiguredStartupTheme(), "startup theme apply");
  }, 1200);
}

module.exports = { registerThemeReactor };
