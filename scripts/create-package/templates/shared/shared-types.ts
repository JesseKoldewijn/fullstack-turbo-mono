// Common types for {{packageName}}
export interface User {
	id: string;
	name: string;
	email: string;
}

export interface ApiResponse<T = any> {
	success: boolean;
	data?: T;
	message?: string;
	error?: string;
}
