"use client";

import { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

export const Button = ({ onClick, children, disabled }: ButtonProps) => {
  return (
    <button
      onClick={onClick}
      type="button"
      disabled={disabled}
      className="text-white bg-gray-800 hover:bg-green-600 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm sm:px-5 sm:py-2.5 px-4 py-2 me-2 mb-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-800"
    >
      {children}
    </button>

  );
};
