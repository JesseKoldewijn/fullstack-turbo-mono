#!/usr/bin/env node

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createInterface } from "readline";

const __filename = fileURLToPath(import.meta.url);
// Directory of this script (scripts/create-package)
const __dirname = dirname(__filename);

export interface PackageOptions {
	packageName: string;
	directoryName: string;
	packageType: "client" | "backend" | "shared";
	description: string;
	author: string;
	includeTests: boolean;
	includeLinting: boolean;
}

interface TemplateFile {
	source: string;
	destination: string;
	isTemplate: boolean;
}

// Create readline interface for prompts
const rl = createInterface({
	input: process.stdin,
	output: process.stdout,
});

// Helper function to prompt user input
const prompt = (question: string): Promise<string> => {
	return new Promise((resolve) => {
		rl.question(question, (answer) => {
			resolve(answer.trim());
		});
	});
};

// Helper function to prompt yes/no questions
const promptYesNo = async (
	question: string,
	defaultValue: boolean = false
): Promise<boolean> => {
	const defaultText = defaultValue ? "[Y/n]" : "[y/N]";
	const answer = await prompt(`${question} ${defaultText}: `);

	if (!answer.trim()) return defaultValue;

	return answer.toLowerCase().startsWith("y");
};

// Helper function to replace template variables
const replaceTemplateVariables = (
	content: string,
	options: PackageOptions
): string => {
	const workspaceName = getWorkspaceName();

	return content
		.replace(/\{\{packageName\}\}/g, options.packageName)
		.replace(/\{\{directoryName\}\}/g, options.directoryName)
		.replace(/\{\{description\}\}/g, options.description)
		.replace(/\{\{author\}\}/g, options.author)
		.replace(/\{\{workspace\}\}/g, workspaceName)
		.replace(
			/\{\{scripts\}\}/g,
			getScriptsDocumentation(options.packageType)
		)
		.replace(
			/\{\{devInstructions\}\}/g,
			getDevInstructions(options.packageType)
		);
};

// Get workspace name from package.json
const getWorkspaceName = (): string => {
	try {
		const projectRoot = join(__dirname, "../../");
		const packageJsonPath = join(projectRoot, "package.json");
		const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
		return packageJson.name || "workspace";
	} catch (error) {
		return "workspace";
	}
};

// Get scripts documentation based on package type
const getScriptsDocumentation = (packageType: string): string => {
	switch (packageType) {
		case "client":
			return `- \`yarn dev\` - Start development server
- \`yarn build\` - Build for production
- \`yarn preview\` - Preview production build
- \`yarn lint\` - Run ESLint
- \`yarn type-check\` - Run TypeScript type checking`;
		case "backend":
			return `- \`yarn dev\` - Start development server with hot reload
- \`yarn build\` - Build TypeScript to JavaScript
- \`yarn start\` - Start production server
- \`yarn lint\` - Run ESLint
- \`yarn type-check\` - Run TypeScript type checking`;
		case "shared":
			return `- \`yarn build\` - Build TypeScript library
- \`yarn dev\` - Build in watch mode
- \`yarn lint\` - Run ESLint
- \`yarn type-check\` - Run TypeScript type checking`;
		default:
			return "";
	}
};

// Get development instructions based on package type
const getDevInstructions = (packageType: string): string => {
	switch (packageType) {
		case "client":
			return `To start developing:

\`\`\`bash
yarn dev
\`\`\`

This will start the Vite development server with hot module replacement.`;
		case "backend":
			return `To start developing:

\`\`\`bash
yarn dev
\`\`\`

This will start the server with hot reload using tsx watch.`;
		case "shared":
			return `To start developing:

\`\`\`bash
yarn dev
\`\`\`

This will build the library in watch mode for development.`;
		default:
			return "";
	}
};

// Get template files based on package type
// Templates are organized into per-concern directories under scripts/create-package/templates/
// - templates/common
// - templates/client
// - templates/backend
// - templates/shared
const getTemplateFiles = (options: PackageOptions): TemplateFile[] => {
	const templatesRoot = join(__dirname, "templates");
	const commonDir = join(templatesRoot, "common");
	const clientDir = join(templatesRoot, "client");
	const backendDir = join(templatesRoot, "backend");
	const sharedDir = join(templatesRoot, "shared");

	const commonFiles: TemplateFile[] = [
		{
			source: join(commonDir, "README.md"),
			destination: "README.md",
			isTemplate: true,
		},
	];

	// package.json and tsconfig come from per-type folders if available, otherwise fall back to common
	commonFiles.push({
		source: join(
			options.packageType === "client"
				? clientDir
				: options.packageType === "backend"
				? backendDir
				: sharedDir,
			`${options.packageType}-package.json`
		),
		destination: "package.json",
		isTemplate: true,
	});

	commonFiles.push({
		source: join(
			options.packageType === "client"
				? clientDir
				: options.packageType === "backend"
				? backendDir
				: sharedDir,
			`${options.packageType}-tsconfig.json`
		),
		destination: "tsconfig.json",
		isTemplate: true,
	});

	// Add package-specific files
	switch (options.packageType) {
		case "client":
			// Client packages are intended to be component libraries consumed by apps.
			// Provide minimal library entry and a sample component.
			commonFiles.push(
				{
					source: join(clientDir, "src-index.tsx"),
					destination: "src/index.tsx",
					isTemplate: true,
				},
				{
					source: join(clientDir, "src-component.tsx"),
					destination: "src/components/Widget.tsx",
					isTemplate: true,
				}
			);
			break;
		case "backend":
			commonFiles.push({
				source: join(backendDir, "backend-index.ts"),
				destination: "src/index.ts",
				isTemplate: true,
			});

			// include backend test setup files when requested
			if (options.includeTests) {
				commonFiles.push({
					source: join(backendDir, "vitest.config.ts"),
					destination: "vitest.config.ts",
					isTemplate: false,
				});

				commonFiles.push({
					source: join(backendDir, "test-setup.ts"),
					destination: "test-setup.ts",
					isTemplate: false,
				});
			}
			break;
		case "shared":
			commonFiles.push(
				{
					source: join(sharedDir, "shared-index.ts"),
					destination: "src/index.ts",
					isTemplate: true,
				},
				{
					source: join(sharedDir, "shared-types.ts"),
					destination: "src/types.ts",
					isTemplate: true,
				},
				{
					source: join(sharedDir, "shared-utils.ts"),
					destination: "src/utils.ts",
					isTemplate: true,
				}
			);

			// include shared test setup when requested
			if (options.includeTests) {
				commonFiles.push({
					source: join(sharedDir, "vitest.config.ts"),
					destination: "vitest.config.ts",
					isTemplate: false,
				});

				commonFiles.push({
					source: join(sharedDir, "test-setup.ts"),
					destination: "test-setup.ts",
					isTemplate: false,
				});
			}
			break;
	}

	// include client test setup when requested
	if (options.packageType === "client" && options.includeTests) {
		commonFiles.push({
			source: join(clientDir, "vitest.config.ts"),
			destination: "vitest.config.ts",
			isTemplate: false,
		});

		commonFiles.push({
			source: join(clientDir, "test-setup.ts"),
			destination: "test-setup.ts",
			isTemplate: false,
		});
	}

	return commonFiles;
};

// Create package directory and files
export const createPackage = async (options: PackageOptions): Promise<void> => {
	const projectRoot = join(__dirname, "../../");
	const packagesDir = join(projectRoot, "packages");
	const packageDir = join(packagesDir, options.directoryName);

	// Create packages directory if it doesn't exist
	if (!existsSync(packagesDir)) {
		mkdirSync(packagesDir, { recursive: true });
		console.log(`📁 Created packages directory`);
	}

	// Check if package already exists
	if (existsSync(packageDir)) {
		throw new Error(
			`Package directory '${options.directoryName}' already exists!`
		);
	}

	// Create package directory
	mkdirSync(packageDir, { recursive: true });
	console.log(`📁 Created package directory: ${options.directoryName}`);

	// Get template files
	const templateFiles = getTemplateFiles(options);

	// Copy and process template files
	for (const file of templateFiles) {
		const destPath = join(packageDir, file.destination);
		const destDir = dirname(destPath);

		// Create destination directory if it doesn't exist
		if (!existsSync(destDir)) {
			mkdirSync(destDir, { recursive: true });
		}

		try {
			// Read template content
			const content = readFileSync(file.source, "utf-8");

			// Process template if needed
			const processedContent = file.isTemplate
				? replaceTemplateVariables(content, options)
				: content;

			// Write file
			writeFileSync(destPath, processedContent);
			console.log(`📄 Created: ${file.destination}`);
		} catch (error) {
			console.warn(
				`⚠️  Warning: Could not create ${file.destination} - template file may be missing`
			);
		}
	}

	console.log(`\n✅ Package '${options.packageName}' created successfully!`);
	console.log(`📍 Location: packages/${options.directoryName}`);
	console.log(`\nNext steps:`);
	console.log(`1. cd packages/${options.directoryName}`);
	console.log(`2. yarn install`);

	if (options.packageType === "client") {
		console.log(`3. yarn dev (to start development server)`);
	} else if (options.packageType === "backend") {
		console.log(`3. yarn dev (to start development server)`);
	} else {
		console.log(`3. yarn build (to build the library)`);
	}
};

// Main execution
const main = async (): Promise<void> => {
	console.log("🚀 Package Creator for Fullstack Turbo Split\n");

	try {
		// Collect package information
		const packageName = await prompt(
			"📦 Package name (e.g., my-awesome-package): "
		);
		if (!packageName) {
			throw new Error("Package name is required!");
		}

		const directoryName =
			(await prompt(`📁 Directory name (default: ${packageName}): `)) ||
			packageName;

		const packageTypeInput =
			(await prompt(
				"🏗️  Package type (client/backend/shared) [shared]: "
			)) || "shared";
		if (!["client", "backend", "shared"].includes(packageTypeInput)) {
			throw new Error("Package type must be: client, backend, or shared");
		}
		const packageType = packageTypeInput as "client" | "backend" | "shared";

		const description =
			(await prompt("📝 Package description: ")) ||
			`A ${packageType} package for ${packageName}`;

		const author = (await prompt("👤 Author name: ")) || "Your Name";

		const includeTests = await promptYesNo("🧪 Include test setup?", false);
		const includeLinting = await promptYesNo(
			"🔍 Include ESLint configuration?",
			true
		);

		const options: PackageOptions = {
			packageName,
			directoryName,
			packageType,
			description,
			author,
			includeTests,
			includeLinting,
		};

		// Confirm package creation
		console.log("\n📋 Package Configuration:");
		console.log(`   Name: ${options.packageName}`);
		console.log(`   Directory: ${options.directoryName}`);
		console.log(`   Type: ${options.packageType}`);
		console.log(`   Description: ${options.description}`);
		console.log(`   Author: ${options.author}`);
		console.log(`   Tests: ${options.includeTests ? "Yes" : "No"}`);
		console.log(`   Linting: ${options.includeLinting ? "Yes" : "No"}`);

		const confirm = await promptYesNo("\n✅ Create this package?", true);

		if (!confirm) {
			console.log("❌ Package creation cancelled.");
			rl.close();
			return;
		}

		// Create the package
		await createPackage(options);
		rl.close();
	} catch (error) {
		console.error(
			`\n❌ Error: ${
				error instanceof Error ? error.message : String(error)
			}`
		);
		rl.close();
		process.exit(1);
	}
};

// Run the script
main().catch((error) => {
	console.error("Unexpected error:", error);
	process.exit(1);
});
