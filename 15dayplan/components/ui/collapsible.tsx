import * as React from "react";

interface CollapsibleContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CollapsibleContext = React.createContext<CollapsibleContextValue | undefined>(
  undefined
);

interface CollapsibleProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

export function Collapsible({
  open,
  defaultOpen = false,
  onOpenChange,
  children,
}: CollapsibleProps) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;

  const handleOpenChange = React.useCallback(
    (value: boolean) => {
      if (!isControlled) {
        setInternalOpen(value);
      }
      onOpenChange?.(value);
    },
    [isControlled, onOpenChange]
  );

  return (
    <CollapsibleContext.Provider
      value={{ open: isOpen, onOpenChange: handleOpenChange }}
    >
      {children}
    </CollapsibleContext.Provider>
  );
}

interface CollapsibleTriggerProps extends React.HTMLAttributes<HTMLElement> {
  asChild?: boolean;
  children?: React.ReactNode;
}

export function CollapsibleTrigger({
  asChild = false,
  children,
  ...props
}: CollapsibleTriggerProps) {
  const context = React.useContext(CollapsibleContext);

  if (!context) {
    throw new Error("CollapsibleTrigger must be used within a Collapsible");
  }

  const { open, onOpenChange } = context;

  const handleClick = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
    onOpenChange(!open);
    props.onClick?.(e);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement, {
      ...props,
      onClick: handleClick,
    });
  }

  return (
    <button type="button" {...props} onClick={handleClick}>
      {children}
    </button>
  );
}

interface CollapsibleContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export function CollapsibleContent({
  children,
  ...props
}: CollapsibleContentProps) {
  const context = React.useContext(CollapsibleContext);

  if (!context) {
    throw new Error("CollapsibleContent must be used within a Collapsible");
  }

  const { open } = context;

  if (!open) {
    return null;
  }

  return (
    <div {...props}>
      {children}
    </div>
  );
}