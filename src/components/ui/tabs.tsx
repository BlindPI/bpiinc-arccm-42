import * as React from "react";

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

export function Tabs({
  className,
  defaultValue,
  value,
  onValueChange,
  children,
  ...props
}: TabsProps) {
  const [selectedValue, setSelectedValue] = React.useState(value || defaultValue);

  React.useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value);
    }
  }, [value]);

  const handleValueChange = (newValue: string) => {
    if (value === undefined) {
      setSelectedValue(newValue);
    }
    onValueChange?.(newValue);
  };

  // Filter out non-DOM props before passing to div
  const { value: _, onValueChange: __, defaultValue: ___, ...domProps } = props as any;
  
  return (
    <div className={`${className || ""}`} {...domProps}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            selectedValue,
            onValueChange: handleValueChange,
          });
        }
        return child;
      })}
    </div>
  );
}

interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
  selectedValue?: string;
  onValueChange?: (value: string) => void;
}

export function TabsList({
  className,
  children,
  selectedValue,
  onValueChange,
  ...props
}: TabsListProps) {
  // Filter out custom props that shouldn't be passed to DOM
  const { selectedValue: _, onValueChange: __, ...domProps } = props as any;
  
  return (
    <div
      className={`inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500 ${className || ""}`}
      {...domProps}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            selectedValue,
            onValueChange,
          });
        }
        return child;
      })}
    </div>
  );
}

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  children?: React.ReactNode;
  value: string;
  selectedValue?: string;
  onValueChange?: (value: string) => void;
}

export function TabsTrigger({
  className,
  children,
  value,
  selectedValue,
  onValueChange,
  ...props
}: TabsTriggerProps) {
  const isSelected = selectedValue === value;

  return (
    <button
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
        isSelected
          ? "bg-white text-gray-900 shadow-sm"
          : "text-gray-500 hover:text-gray-900"
      } ${className || ""}`}
      onClick={() => onValueChange?.(value)}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
  value: string;
  selectedValue?: string;
}

export function TabsContent({
  className,
  children,
  value,
  selectedValue,
  ...props
}: TabsContentProps) {
  const isSelected = selectedValue === value;

  if (!isSelected) {
    return null;
  }

  // Filter out custom props that shouldn't be passed to DOM
  const { selectedValue: _, ...domProps } = props as any;

  return (
    <div
      className={`mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className || ""}`}
      {...domProps}
    >
      {children}
    </div>
  );
}