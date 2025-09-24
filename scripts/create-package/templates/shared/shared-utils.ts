// Utility functions for {{packageName}}
export const capitalize = (str: string): string => {
	return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const formatDate = (date: Date): string => {
	return date.toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
};

export const delay = (ms: number): Promise<void> => {
	return new Promise((resolve) => setTimeout(resolve, ms));
};
