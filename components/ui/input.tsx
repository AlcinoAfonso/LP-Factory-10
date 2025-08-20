/** @temporary - shadcn compat */
import * as React from "react";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={`rounded-xl border px-3 py-2 outline-none focus:ring ${className ?? ""}`}
      {...props}
    />
  )
);
Input.displayName = "Input";
