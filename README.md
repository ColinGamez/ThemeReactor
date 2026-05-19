# Colin's Theme Reactor

Theme Reactor automatically switches VS Code themes by season, holiday month, time of day, random favorites, and workspace overrides.

It works with any installed VS Code theme names. It is tuned out of the box for **Colin's VS Code Themes**, so install that theme pack too if you want the default rotations to light up exactly as designed.

## Features

- Apply current seasonal or holiday themes.
- Enable startup auto-theme switching.
- Enable a hybrid Theme Reactor that changes while VS Code is open.
- Pick, randomize, and configure favorite themes.
- Set a workspace-specific theme override.
- Apply coding presets for orange, focus, light, and gaming setups.

## Usage

Run **Colin's Theme Reactor: Enable Theme Reactor** from the Command Palette, then adjust settings under `themeReactor.*` if you want custom theme names.

## Local Development

```sh
npm install
npm run build
npx @vscode/vsce package --allow-missing-repository
```
