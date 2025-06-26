import * as React from "react";

interface DialogContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextValue>({
  open: false,
  onOpenChange: () => {}
});

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

export function Dialog({ open = false, onOpenChange = () => {}, children }: DialogProps) {
  const contextValue = React.useMemo(() => ({
    open,
    onOpenChange
  }), [open, onOpenChange]);

  return (
    <DialogContext.Provider value={contextValue}>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => onOpenChange(false)}
          />
          <div className="relative z-50">
            {children}
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}

interface DialogTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
}

export function DialogTrigger({ asChild = false, children }: DialogTriggerProps) {
  const { onOpenChange } = React.useContext(DialogContext);
  
  const handleClick = () => {
    onOpenChange(true);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: handleClick,
      ...children.props
    });
  }

  return (
    <button onClick={handleClick}>
      {children}
    </button>
  );
}

interface DialogCloseProps {
  asChild?: boolean;
  children: React.ReactNode;
}

export function DialogClose({ asChild = false, children }: DialogCloseProps) {
  const { onOpenChange } = React.useContext(DialogContext);
  
  const handleClick = () => {
    onOpenChange(false);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: handleClick,
      ...children.props
    });
  }

  return (
    <button onClick={handleClick}>
      {children}
    </button>
  );
}

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
}

export function DialogContent({ className, children, ...props }: DialogContentProps) {
  return (
    <div 
      className={`bg-white rounded-lg shadow-lg w-full max-w-md mx-auto overflow-auto p-6 ${className || ""}`}
      {...props}
    >
      {children}
    </div>
  );
}

interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
}

export function DialogHeader({ className, children, ...props }: DialogHeaderProps) {
  return (
    <div 
      className={`flex flex-col space-y-1.5 text-center sm:text-left mb-4 ${className || ""}`} 
      {...props}
    >
      {children}
    </div>
  );
}

interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  className?: string;
  children?: React.ReactNode;
}

export function DialogTitle({ className, children, ...props }: DialogTitleProps) {
  return (
    <h3 
      className={`text-lg font-semibold leading-none tracking-tight ${className || ""}`} 
      {...props}
    >
      {children}
    </h3>
  );
}

interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  className?: string;
  children?: React.ReactNode;
}

export function DialogDescription({ className, children, ...props }: DialogDescriptionProps) {
  return (
    <p
      className={`text-sm text-muted-foreground ${className || ""}`}
      {...props}
    >
      {children}
    </p>
  );
}

interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
}

export function DialogFooter({ className, children, ...props }: DialogFooterProps) {
  return (
    <div
      className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 ${className || ""}`}
      {...props}
    >
      {children}
    </div>
  );
}