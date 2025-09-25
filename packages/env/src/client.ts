import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	clientPrefix: "PUBLIC_",
	client: {
		PUBLIC_CLIENT_PORT: z.string().default("4321").transform(Number),
		PUBLIC_BACKEND_URL: z.string().default("http://localhost:1234"),
	},
	runtimeEnv: process.env,
});
