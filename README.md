# Colin's Theme Switcher

Pick and apply VS Code themes from a command-driven switcher. It can choose seasonal, holiday, time-of-day, favorite, random, and workspace-specific theme picks.

It works with any installed VS Code theme names. The defaults are tuned for **Colin's VS Code Themes**.

## Features

- Apply current seasonal or holiday themes.
- Pick a theme by pack.
- Apply the current Theme Switcher pick from your configured mode.
- Pick, randomize, and configure favorite themes.
- Set a workspace-specific theme override.

## Usage

Run **Colin's Theme Switcher: Apply Theme Switcher Now** from the Command Palette, then adjust settings under `colinsThemeSwitcher.*` if you want custom theme names.

## Local Development

```sh
npm install
npm run build
npx @vscode/vsce package --allow-missing-repository
```
