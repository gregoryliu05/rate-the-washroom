"use client";

import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      style={
        {
          "--normal-bg": "#ffffff",
          "--normal-text": "#111111",
          "--normal-border": "#d4d4d8",
          "--error-bg": "#fef2f2",
          "--error-text": "#111111",
          "--error-border": "#fecaca",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
