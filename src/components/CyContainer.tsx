import React from "react";

export function CyContainer({ children }: { children: React.JSX.Element }) {
  return <main className="canvas-container">{children}</main>;
}
