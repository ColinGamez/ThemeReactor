const vscode = require("vscode");
const { PACKS, ALL_THEMES } = require("./themeData");

const DEFAULT_SWITCHER_SCHEDULE = {
  morning: "Spring Bloom",
  day: "Peach Soda",
  evening: "Summer Sunset",
  night: "All Orange"
};
const DEFAULT_SWITCHER_FAVORITES = [
  "All Orange",
  "All Orange High Contrast",
  "Summer Sunset",
  "Autumn Ember",
  "Winter Aurora",
  "Starfighter HUD"
];

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
  return normalized.length ? [...new Set(normalized)] : fallback;
}

function themeSwitcherConfig() {
  return vscode.workspace.getConfiguration("colinsThemeSwitcher");
}

function switcherSchedule(config = themeSwitcherConfig()) {
  const schedule = config.get("schedule", {});

  if (!schedule || typeof schedule !== "object" || Array.isArray(schedule)) {
    return DEFAULT_SWITCHER_SCHEDULE;
  }

  return { ...DEFAULT_SWITCHER_SCHEDULE, ...schedule };
}

function switcherFavorites(config = themeSwitcherConfig()) {
  return safeThemeList(config.get("favorites", DEFAULT_SWITCHER_FAVORITES), DEFAULT_SWITCHER_FAVORITES);
}

function timeTheme(date = new Date()) {
  const schedule = switcherSchedule();
  const bucket = timeBucket(date);

  return {
    label: schedule[bucket.key] || DEFAULT_SWITCHER_SCHEDULE[bucket.key],
    detail: `${bucket.detail} schedule`
  };
}

function themeForDate(date = new Date()) {
  const config = themeSwitcherConfig();
  const rawWorkspaceTheme = config.get("workspaceTheme", "");
  const workspaceTheme = typeof rawWorkspaceTheme === "string" ? rawWorkspaceTheme.trim() : "";

  if (workspaceTheme) {
    return {
      label: workspaceTheme,
      detail: "workspace theme",
      target: vscode.ConfigurationTarget.Workspace
    };
  }

  const mode = config.get("mode", "hybrid");

  if (mode === "seasonal") {
    return monthTheme(date);
  }

  if (mode === "holiday") {
    return holidayTheme(date);
  }

  if (mode === "timeOfDay") {
    return timeTheme(date);
  }

  return isHolidayMonth(date) ? holidayTheme(date) : timeTheme(date);
}

async function setTheme(label, detail, options = {}) {
  const currentTheme = vscode.workspace.getConfiguration("workbench").get("colorTheme");
  const target = options.target ?? vscode.ConfigurationTarget.Global;

  if (currentTheme === label && !options.force) {
    vscode.window.showInformationMessage(`Colin's Theme Switcher: ${label} is already active.`);
    return false;
  }

  await vscode.workspace.getConfiguration("workbench").update("colorTheme", label, target);
  vscode.window.showInformationMessage(`Colin's Theme Switcher: switched to ${label}${detail ? ` (${detail})` : ""}.`);
  return true;
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

async function applyThemeSwitcherNow() {
  const theme = themeForDate();
  await setTheme(theme.label, `Theme Switcher ${theme.detail}`, {
    target: theme.target
  });
}

async function pickSwitcherFavorite() {
  const themes = switcherFavorites();
  const choice = await vscode.window.showQuickPick(
    themes.map((label) => ({ label, description: "Theme Switcher favorite" })),
    { title: "Pick a Theme Switcher favorite", placeHolder: "Choose a favorite theme" }
  );

  if (choice) {
    await setTheme(choice.label, "Theme Switcher favorite");
  }
}

async function randomSwitcherFavorite() {
  const themes = switcherFavorites();
  const label = themes[Math.floor(Math.random() * themes.length)];
  await setTheme(label, "Theme Switcher random favorite");
}

async function configureSwitcherFavorites() {
  const favorites = new Set(switcherFavorites());
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

  await themeSwitcherConfig().update(
    "favorites",
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

  await themeSwitcherConfig().update("workspaceTheme", choice.theme, vscode.ConfigurationTarget.Workspace);

  if (!choice.theme) {
    vscode.window.showInformationMessage("Colin's Theme Switcher: cleared this workspace theme.");
    return;
  }

  await setTheme(choice.theme, "Theme Switcher workspace theme", {
    force: true,
    target: vscode.ConfigurationTarget.Workspace
  });
}

function registerThemeSwitcher(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand("colins-theme-switcher.applySeasonalTheme", applySeasonalTheme),
    vscode.commands.registerCommand("colins-theme-switcher.applyHolidayTheme", applyHolidayTheme),
    vscode.commands.registerCommand("colins-theme-switcher.pickGamingTheme", () => pickThemeFromPack("Gaming")),
    vscode.commands.registerCommand("colins-theme-switcher.pickThemeByPack", pickThemeByPack),
    vscode.commands.registerCommand("colins-theme-switcher.applyThemeSwitcherNow", applyThemeSwitcherNow),
    vscode.commands.registerCommand("colins-theme-switcher.pickSwitcherFavorite", pickSwitcherFavorite),
    vscode.commands.registerCommand("colins-theme-switcher.randomSwitcherFavorite", randomSwitcherFavorite),
    vscode.commands.registerCommand("colins-theme-switcher.configureSwitcherFavorites", configureSwitcherFavorites),
    vscode.commands.registerCommand("colins-theme-switcher.setSwitcherWorkspaceTheme", setSwitcherWorkspaceTheme)
  );
}

module.exports = { registerThemeSwitcher };
