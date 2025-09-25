#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync } from "fs";
import { execSync } from "child_process";
import path from "path";

// Check if any package needs building
const packagesDir = "packages";

// Discover all packages in the packages directory
const discoverPackages = () => {
	if (!existsSync(packagesDir)) {
		console.log("No packages directory found.");
		return [];
	}

	const packageDirs = readdirSync(packagesDir, { withFileTypes: true })
		.filter((dirent) => dirent.isDirectory())
		.map((dirent) => dirent.name);

	const packages = [];

	for (const dir of packageDirs) {
		const packageJsonPath = path.join(packagesDir, dir, "package.json");

		if (existsSync(packageJsonPath)) {
			try {
				const packageJson = JSON.parse(
					readFileSync(packageJsonPath, "utf-8")
				);

				// Check if package has a build script
				if (packageJson.scripts && packageJson.scripts.build) {
					packages.push({
						name: packageJson.name || dir,
						dir,
						hasMainOutput:
							!!packageJson.main || !!packageJson.exports,
					});
				}
			} catch (error) {
				console.warn(
					`Failed to parse package.json for ${dir}:`,
					error instanceof Error ? error.message : error
				);
			}
		}
	}

	return packages;
};

const packages = discoverPackages();

if (packages.length === 0) {
	console.log("No packages with build scripts found.");
	process.exit(0);
}

console.log(`Found ${packages.length} package(s) with build scripts:`);
packages.forEach((pkg) => console.log(`  - ${pkg.name} (${pkg.dir})`));

let packagesToBuild = [];

for (const pkg of packages) {
	const distPath = path.join(packagesDir, pkg.dir, "dist");
	let needsBuild = false;

	if (!existsSync(distPath)) {
		needsBuild = true;
	} else if (pkg.hasMainOutput) {
		// Check for common output files
		const commonOutputs = ["index.js", "index.cjs", "index.mjs"];
		const hasAnyOutput = commonOutputs.some((output) =>
			existsSync(path.join(distPath, output))
		);

		if (!hasAnyOutput) {
			needsBuild = true;
		}
	}

	if (needsBuild) {
		console.log(`Package ${pkg.name} needs building...`);
		packagesToBuild.push(pkg);
	}
}

if (packagesToBuild.length > 0) {
	console.log(`Building ${packagesToBuild.length} package(s)...`);

	// Build packages using turbo with filters
	const filters = packagesToBuild
		.map((pkg) => `--filter=${pkg.name}`)
		.join(" ");
	const buildCommand = `yarn turbo build ${filters} --force`;

	console.log(`Running: ${buildCommand}`);
	execSync(buildCommand, {
		stdio: "inherit",
	});
} else {
	console.log("All packages are up to date.");
}
