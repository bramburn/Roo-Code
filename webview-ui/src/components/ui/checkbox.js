"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
const checkboxVariants = cva("peer h-4 w-4 shrink-0 rounded-sm border ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", {
    variants: {
        variant: {
            default: "border-vscode-foreground data-[state=checked]:bg-vscode-foreground data-[state=checked]:text-primary-foreground",
            description: "border-vscode-descriptionForeground data-[state=checked]:bg-vscode-descriptionForeground data-[state=checked]:text-white",
        },
    },
    defaultVariants: {
        variant: "default",
    },
});
const Checkbox = React.forwardRef(({ className, variant, ...props }, ref) => (_jsx(CheckboxPrimitive.Root, { ref: ref, className: cn(checkboxVariants({ variant, className })), ...props, children: _jsx(CheckboxPrimitive.Indicator, { className: cn("flex items-center justify-center text-current"), children: _jsx(Check, { className: "h-4 w-4 text-vscode-background" }) }) })));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;
export { Checkbox, checkboxVariants };
//# sourceMappingURL=checkbox.js.map