// Backend test setup for Vitest (node environment)
// Place any global test setup here, e.g. environment variables or shared mocks
if (!process.env.NODE_ENV) {
	process.env.NODE_ENV = "test";
}
