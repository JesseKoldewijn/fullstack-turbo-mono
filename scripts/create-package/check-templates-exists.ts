const { join } = require("path");
const { existsSync } = require("fs");

const base = __dirname;
const templatesRoot = join(base, "templates");
const files = [
	join(templatesRoot, "common/README.md"),
	join(templatesRoot, "client/client-package.json"),
	join(templatesRoot, "client/client-tsconfig.json"),
	join(templatesRoot, "client/src-index.tsx"),
	join(templatesRoot, "client/src-component.tsx"),
	join(templatesRoot, "backend/backend-package.json"),
	join(templatesRoot, "backend/backend-tsconfig.json"),
	join(templatesRoot, "backend/backend-index.ts"),
	join(templatesRoot, "shared/shared-package.json"),
	join(templatesRoot, "shared/shared-tsconfig.json"),
	join(templatesRoot, "shared/shared-index.ts"),
	join(templatesRoot, "shared/shared-types.ts"),
	join(templatesRoot, "shared/shared-utils.ts"),
];

let ok = true;
for (const f of files) {
	if (!existsSync(f)) {
		console.log("MISS", f);
		ok = false;
	} else {
		console.log("OK  ", f);
	}
}
process.exit(ok ? 0 : 2);
