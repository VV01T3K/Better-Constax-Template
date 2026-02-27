// oxlint-disable no-console
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const TARGET_PACKAGE = "@convex-dev/better-auth";
const TARGET_PREFIX = `${TARGET_PACKAGE}@`;

const packageJson = JSON.parse(readFileSync(resolve("package.json"), "utf8"));
const patchedDependencies = packageJson.patchedDependencies ?? {};
const patchedKeys = Object.keys(patchedDependencies).filter((key) => key.startsWith(TARGET_PREFIX));

if (patchedKeys.length === 0) {
	console.error(`[verify-patches] Missing patchedDependencies entry for ${TARGET_PACKAGE}.`);
	process.exit(1);
}

if (patchedKeys.length > 1) {
	console.error(
		`[verify-patches] Found multiple patch entries for ${TARGET_PACKAGE}: ${patchedKeys.join(", ")}`,
	);
	process.exit(1);
}

const installedPackageJsonPath = resolve("node_modules", TARGET_PACKAGE, "package.json");
if (!existsSync(installedPackageJsonPath)) {
	// Fresh checkout before install: skip quietly.
	process.exit(0);
}

const installedPackageJson = JSON.parse(readFileSync(installedPackageJsonPath, "utf8"));
const installedVersion = installedPackageJson.version;
const expectedKey = `${TARGET_PACKAGE}@${installedVersion}`;
const actualKey = patchedKeys[0];

if (actualKey !== expectedKey) {
	console.error(
		`[verify-patches] Patch version mismatch.\n  installed: ${expectedKey}\n  patched:   ${actualKey}\n  Fix: regenerate patch with \`mise exec bun -- bun patch ${expectedKey}\` and update package.json patchedDependencies.`,
	);
	process.exit(1);
}

const patchPath = resolve(patchedDependencies[actualKey]);
if (!existsSync(patchPath)) {
	console.error(`[verify-patches] Patch file missing: ${patchedDependencies[actualKey]}`);
	process.exit(1);
}
console.log(`[verify-patches] OK: ${actualKey} -> ${patchedDependencies[actualKey]}`);
