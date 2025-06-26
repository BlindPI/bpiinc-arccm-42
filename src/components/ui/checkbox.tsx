import * as React from "react";

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
}

export function Checkbox({
  className,
  checked,
  onCheckedChange,
  ...props
}: CheckboxProps) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onCheckedChange?.(event.target.checked);
  };

  // Filter out custom props that shouldn't be passed to DOM
  const { onCheckedChange: _, ...domProps } = props as any;

  return (
    <div className="relative flex items-center">
      <input
        type="checkbox"
        className={`peer h-4 w-4 shrink-0 rounded-sm border border-primary appearance-none disabled:cursor-not-allowed disabled:opacity-50 ${
          checked ? "bg-blue-600 border-blue-600" : "bg-white"
        } ${className || ""}`}
        checked={checked}
        onChange={handleChange}
        {...domProps}
      />
      {checked && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="absolute h-3 w-3 text-white left-0.5 top-0.5 pointer-events-none"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </div>
  );
}