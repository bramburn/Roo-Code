import { jsx as _jsx } from "react/jsx-runtime";
import { useCallback, forwardRef, useState, useEffect } from "react";
import { DecoratedVSCodeTextField } from "./DecoratedVSCodeTextField";
function FormattedTextFieldInner({ value, onValueChange, formatter, ...restProps }, forwardedRef) {
    const [rawInput, setRawInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    // Update raw input when external value changes (but not when we're actively typing)
    useEffect(() => {
        if (!isTyping) {
            setRawInput(formatter.format(value));
        }
    }, [value, formatter, isTyping]);
    const handleInput = useCallback((e) => {
        const input = e.target;
        setIsTyping(true);
        let filteredValue = input.value;
        if (formatter.filter) {
            filteredValue = formatter.filter(input.value);
            input.value = filteredValue;
        }
        setRawInput(filteredValue);
        const parsedValue = formatter.parse(filteredValue);
        onValueChange(parsedValue);
    }, [formatter, onValueChange]);
    const handleBlur = useCallback(() => {
        setIsTyping(false);
        // On blur, format the value properly
        setRawInput(formatter.format(value));
    }, [formatter, value]);
    const displayValue = isTyping ? rawInput : formatter.format(value);
    return (_jsx(DecoratedVSCodeTextField, { ...restProps, value: displayValue, onInput: handleInput, onBlur: handleBlur, ref: forwardedRef }));
}
export const FormattedTextField = forwardRef(FormattedTextFieldInner);
// Common formatters for reuse
export const unlimitedIntegerFormatter = {
    parse: (input) => {
        if (input.trim() === "")
            return undefined;
        const value = parseInt(input);
        return !isNaN(value) && value > 0 ? value : undefined;
    },
    format: (value) => {
        return value === undefined || value === Infinity ? "" : value.toString();
    },
    filter: (input) => input.replace(/[^0-9]/g, ""),
};
export const unlimitedDecimalFormatter = {
    parse: (input) => {
        if (input.trim() === "")
            return undefined;
        const value = parseFloat(input);
        return !isNaN(value) && value >= 0 ? value : undefined;
    },
    format: (value) => {
        return value === undefined || value === Infinity ? "" : value.toString();
    },
    filter: (input) => {
        // Remove all non-numeric and non-dot characters
        let cleanValue = input.replace(/[^0-9.]/g, "");
        // Handle multiple dots - keep only the first one
        const firstDotIndex = cleanValue.indexOf(".");
        if (firstDotIndex !== -1) {
            // Keep everything up to and including the first dot, then remove any additional dots
            const beforeDot = cleanValue.substring(0, firstDotIndex + 1);
            const afterDot = cleanValue.substring(firstDotIndex + 1).replace(/\./g, "");
            cleanValue = beforeDot + afterDot;
        }
        return cleanValue;
    },
};
//# sourceMappingURL=FormattedTextField.js.map