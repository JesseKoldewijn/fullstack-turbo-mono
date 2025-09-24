#!/usr/bin/env node
import { execSync } from "child_process";
import {
	writeFileSync,
	existsSync,
	mkdirSync,
	readFileSync,
	rmSync,
	renameSync,
} from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projectRoot = join(__dirname, "../../");
const templatesRoot = join(__dirname, "templates");
const packagesDir = join(projectRoot, "packages");

const run = (cmd: string, cwd?: string) => {
	console.log(`> ${cmd}`);
	return execSync(cmd, { stdio: "inherit", cwd: cwd || projectRoot });
};

const replaceVars = (content: string, name: string, dirName: string) =>
	content
		.replace(/\{\{packageName\}\}/g, name)
		.replace(/\{\{directoryName\}\}/g, dirName);

const copyTemplates = (
	type: "client" | "backend" | "shared",
	name: string,
	dirName: string
) => {
	const typeDir = join(templatesRoot, type);
	const files = {
		"package.json": join(typeDir, `${type}-package.json`),
		"tsconfig.json": join(typeDir, `${type}-tsconfig.json`),
	};

	const dest = join(packagesDir, dirName);
	if (!existsSync(dest)) mkdirSync(dest, { recursive: true });

	for (const [destName, srcPath] of Object.entries(files)) {
		try {
			const content = readFileSync(srcPath, "utf-8");
			writeFileSync(
				join(dest, destName),
				replaceVars(content, name, dirName)
			);
		} catch (e) {
			console.warn("missing template", srcPath);
		}
	}

	// copy package-specific files
	if (type === "client") {
		const clientDir = join(templatesRoot, "client");
		const srcIndex = readFileSync(
			join(clientDir, "src-index.tsx"),
			"utf-8"
		);
		const srcComp = readFileSync(
			join(clientDir, "src-component.tsx"),
			"utf-8"
		);
		const srcDir = join(dest, "src");
		if (!existsSync(srcDir)) mkdirSync(srcDir, { recursive: true });
		writeFileSync(
			join(srcDir, "index.tsx"),
			replaceVars(srcIndex, name, dirName)
		);
		mkdirSync(join(srcDir, "components"), { recursive: true });
		writeFileSync(
			join(srcDir, "components", "Widget.tsx"),
			replaceVars(srcComp, name, dirName)
		);

		// copy test setup and vitest config if present
		const clientTestSetup = join(clientDir, "test-setup.ts");
		const clientVitest = join(clientDir, "vitest.config.ts");
		// ensure test dir exists, then copy test setup and vitest config if present
		const clientTestDir = join(dest, "test");
		if (!existsSync(clientTestDir))
			mkdirSync(clientTestDir, { recursive: true });
		try {
			writeFileSync(
				join(clientTestDir, "test-setup.ts"),
				readFileSync(clientTestSetup, "utf-8")
			);
		} catch (e) {
			// swallow but log for debugging
			console.warn("failed to copy client test-setup:", e?.message || e);
		}
		try {
			writeFileSync(
				join(dest, "vitest.config.ts"),
				readFileSync(clientVitest, "utf-8")
			);
		} catch (e) {
			console.warn(
				"failed to copy client vitest config:",
				e?.message || e
			);
		}
	}

	if (type === "backend") {
		const backendDir = join(templatesRoot, "backend");
		const idx = readFileSync(join(backendDir, "backend-index.ts"), "utf-8");
		const srcDir = join(dest, "src");
		if (!existsSync(srcDir)) mkdirSync(srcDir, { recursive: true });
		writeFileSync(
			join(srcDir, "index.ts"),
			replaceVars(idx, name, dirName)
		);
		try {
			writeFileSync(
				join(dest, "vitest.config.ts"),
				readFileSync(join(backendDir, "vitest.config.ts"), "utf-8")
			);
		} catch {}
		try {
			writeFileSync(
				join(dest, "test-setup.ts"),
				readFileSync(join(backendDir, "test-setup.ts"), "utf-8")
			);
		} catch {}
	}

	if (type === "shared") {
		const sharedDir = join(templatesRoot, "shared");
		const idx = readFileSync(join(sharedDir, "shared-index.ts"), "utf-8");
		const types = readFileSync(join(sharedDir, "shared-types.ts"), "utf-8");
		const utils = readFileSync(join(sharedDir, "shared-utils.ts"), "utf-8");
		const srcDir = join(dest, "src");
		if (!existsSync(srcDir)) mkdirSync(srcDir, { recursive: true });
		writeFileSync(
			join(srcDir, "index.ts"),
			replaceVars(idx, name, dirName)
		);
		writeFileSync(
			join(srcDir, "types.ts"),
			replaceVars(types, name, dirName)
		);
		writeFileSync(
			join(srcDir, "utils.ts"),
			replaceVars(utils, name, dirName)
		);
		try {
			writeFileSync(
				join(dest, "vitest.config.ts"),
				readFileSync(join(sharedDir, "vitest.config.ts"), "utf-8")
			);
		} catch {}
		try {
			writeFileSync(
				join(dest, "test-setup.ts"),
				readFileSync(join(sharedDir, "test-setup.ts"), "utf-8")
			);
		} catch {}
	}
};

const createDummyTest = (pkgDir: string, type: string) => {
	if (!existsSync(pkgDir)) return;
	if (type === "client") {
		const testDir = join(pkgDir, "test");
		if (!existsSync(testDir)) mkdirSync(testDir, { recursive: true });
		writeFileSync(
			join(testDir, "dummy.test.tsx"),
			`import { render, screen } from '@testing-library/react'
import App from '../src/index'
describe('dummy client', ()=>{ it('renders', ()=>{ render(<div>Hello from Client App</div>); expect(screen.getByText(/Hello from Client App/i)).toBeInTheDocument(); }) })`
		);
	} else if (type === "backend") {
		const srcDir = join(pkgDir, "src");
		if (!existsSync(srcDir)) mkdirSync(srcDir, { recursive: true });
		writeFileSync(
			join(srcDir, "dummy.test.ts"),
			`import { describe, it, expect } from 'vitest'
describe('dummy backend', ()=>{ it('math', ()=>{ expect(1+1).toBe(2) }) })`
		);
	} else if (type === "shared") {
		const testDir = join(pkgDir, "test");
		if (!existsSync(testDir)) mkdirSync(testDir, { recursive: true });
		writeFileSync(
			join(testDir, "dummy.test.ts"),
			`import { describe, it, expect } from 'vitest'
describe('dummy shared', ()=>{ it('truthy', ()=>{ expect(true).toBe(true) }) })`
		);
	}
};

const main = async () => {
	const install = process.argv.includes("--install");
	const noClean = process.argv.includes("--no-clean");
	const targets: Array<{
		name: string;
		type: "client" | "backend" | "shared";
	}> = [
		{ name: "smoke-client", type: "client" },
		{ name: "smoke-backend", type: "backend" },
		{ name: "smoke-shared", type: "shared" },
	];

	const backups = new Map<string, string>();
	const created = new Set<string>();

	for (const t of targets) {
		const name = t.name;
		const dirName = t.name;
		const pkgDir = join(packagesDir, dirName);

		// If a package dir already exists, move it aside (backup) so we run against a clean slate,
		// but remember to restore it afterwards. We only delete dirs we actually create.
		if (existsSync(pkgDir)) {
			try {
				if (pkgDir.startsWith(packagesDir)) {
					const backupPath = `${pkgDir}.smoke-backup-${Date.now()}`;
					renameSync(pkgDir, backupPath);
					backups.set(dirName, backupPath);
					console.log(
						`pre-backed up existing ${dirName} -> ${backupPath}`
					);
				} else {
					console.warn(
						"refusing to pre-backup path outside packagesDir",
						pkgDir
					);
				}
			} catch (preRmErr) {
				console.warn(
					"pre-backup failed for",
					dirName,
					preRmErr?.message || preRmErr
				);
			}
		}

		copyTemplates(t.type, name, dirName);
		createDummyTest(pkgDir, t.type);

		// mark as created only if there was no pre-existing backup (i.e. we created it now)
		if (!backups.has(dirName)) created.add(dirName);

		if (install) {
			try {
				run("yarn install", pkgDir);
				run("yarn type-check", pkgDir);
				run("yarn test --silent --run", pkgDir);
			} catch (e) {
				console.error("install/test failed for", dirName, e);
			} finally {
				if (!noClean) {
					try {
						if (created.has(dirName)) {
							// we created this package during the smoke run, remove it
							rmSync(pkgDir, { recursive: true, force: true });
							console.log(`cleaned up created ${dirName}`);
						} else if (backups.has(dirName)) {
							// restore the backup we moved aside
							const backupPath = backups.get(dirName)!;
							rmSync(pkgDir, { recursive: true, force: true });
							renameSync(backupPath, pkgDir);
							console.log(`restored backup for ${dirName}`);
						} else {
							// nothing to clean for this package
						}
					} catch (rmErr) {
						console.warn(
							"cleanup failed for",
							dirName,
							rmErr?.message || rmErr
						);
					}
				}
			}
		} else {
			console.log(
				"Created package",
				dirName,
				"— run `yarn install` and tests manually to verify"
			);
			if (!noClean) {
				try {
					if (created.has(dirName)) {
						rmSync(pkgDir, { recursive: true, force: true });
						console.log(`cleaned up created ${dirName}`);
					} else if (backups.has(dirName)) {
						const backupPath = backups.get(dirName)!;
						rmSync(pkgDir, { recursive: true, force: true });
						renameSync(backupPath, pkgDir);
						console.log(`restored backup for ${dirName}`);
					} else {
						// nothing to clean for this package
					}
				} catch (rmErr) {
					console.warn(
						"cleanup failed for",
						dirName,
						rmErr?.message || rmErr
					);
				}
			}
		}
	}
};

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
