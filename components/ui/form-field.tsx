import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

export function FormField({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("grid gap-2", className)} {...props} />;
}

interface FormFieldLabelProps extends React.ComponentPropsWithoutRef<typeof Label> {
  required?: boolean;
}

export function FormFieldLabel({ className, children, required, ...props }: FormFieldLabelProps) {
  return (
    <Label className={cn("text-sm font-medium", className)} {...props}>
      {children}
      {required ? <span aria-hidden="true">*</span> : null}
    </Label>
  );
}

export function FormFieldHint({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-xs text-muted-foreground", className)} {...props} />;
}

export function FormFieldError({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-red-600", className)} role="alert" {...props} />;
}
