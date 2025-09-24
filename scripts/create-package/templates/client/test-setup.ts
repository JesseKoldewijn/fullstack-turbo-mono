// Client test setup for Vitest + React Testing Library
import "@testing-library/jest-dom";

// Mock or set any globals needed by client tests here
// Example: set a fake matchMedia if your components rely on it
if (typeof window !== "undefined" && !window.matchMedia) {
	// @ts-ignore
	window.matchMedia = () => ({
		matches: false,
		addListener: () => {},
		removeListener: () => {},
	});
}
