// Minimal exported handler for backend packages.
// This package provides functions that can be used by an application server.

export type HealthStatus = {
	status: "ok" | "error";
	timestamp: string;
};

export function getWelcomeMessage(packageName: string) {
	return {
		message: `Welcome to ${packageName} API!`,
		status: "running",
	};
}

export function getHealth(): HealthStatus {
	return { status: "ok", timestamp: new Date().toISOString() };
}
