import React from "react";

export interface WidgetProps {
	label?: string;
}

const Widget: React.FC<WidgetProps> = ({ label = "Hello" }) => {
	return <span>{label}</span>;
};

export default Widget;
