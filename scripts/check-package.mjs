import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));

if (pkg.name !== "colins-theme-switcher") {
  throw new Error("package name must be colins-theme-switcher");
}

if (pkg.main || pkg.activationEvents || pkg.contributes) {
  throw new Error("Marketplace pack must not ship executable extension entry points");
}

if (!Array.isArray(pkg.extensionPack) || !pkg.extensionPack.includes("ColinGamez.my-vsc-themes")) {
  throw new Error("expected ColinGamez.my-vsc-themes in extensionPack");
}

console.log("Colin's Theme Switcher extension pack check passed.");
