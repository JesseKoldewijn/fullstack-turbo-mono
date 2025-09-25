import { render } from "@testing-library/react";
import App from "../src/App";

describe("App", () => {
	it("renders greeting", () => {
		const { getByText } = render(<App />);
		expect(getByText(/Hello from Client App/i)).toBeInTheDocument();
	});
});
