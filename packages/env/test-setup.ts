// Shared package test setup - provide DOM testing support and common globals
import "@testing-library/jest-dom";

// Add any globals or mocks that shared utilities rely on
// e.g. a minimal localStorage mock
if (typeof globalThis.localStorage === "undefined") {
	// @ts-ignore
	globalThis.localStorage = {
		_store: {} as Record<string, string>,
		getItem(key: string) {
			return this._store[key] ?? null;
		},
		setItem(key: string, val: string) {
			this._store[key] = String(val);
		},
		removeItem(key: string) {
			delete this._store[key];
		},
		clear() {
			this._store = {};
		},
	};
}
