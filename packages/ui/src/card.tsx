import React from "react";

export function Card({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}): JSX.Element {
  return (
    <div
      className="border p-4 bg-white b-1 shadow-lg"
    >
      <h1 className="sm:text-xl text-lg border-b pb-2 text-green-600 font-semibold">
        {title}
      </h1>
      <div>{children}</div>
    </div>
  );
}