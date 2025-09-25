import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

import { env } from "@acme/env/client";

export default defineConfig({
	plugins: [react()],
	server: {
		port: env.PUBLIC_CLIENT_PORT ?? 3000,
	},
});
