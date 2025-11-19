import React from "react";
interface SpinnerProps {
  text?: string;
}
export const Spinner: React.FC<SpinnerProps> = ({ text = "Loading..." }) => (
  <div className="spinner">
    <img src="favicon.svg" alt="Loading" className="spinner-icon" />
    <span>{text}</span>
  </div>
);
