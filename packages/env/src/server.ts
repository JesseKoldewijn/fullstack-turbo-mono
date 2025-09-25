import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	server: {
		BACKEND_PORT: z.string().default("1234"),
		DATABASE_URL: z.string().default("sqlite://./dev.db"),
	},
	runtimeEnv: process.env,
});
