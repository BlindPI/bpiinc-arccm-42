
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

export const Dialog = React.forwardRef<HTMLDivElement, DialogProps>(
  ({ open = false, onOpenChange = () => {}, children }, ref) => {
    const contextValue = React.useMemo(() => ({
      open,
      onOpenChange
    }), [open, onOpenChange]);

    return (
      <DialogContext.Provider value={contextValue}>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" ref={ref}>
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
);

Dialog.displayName = "Dialog";

interface DialogTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
}

export const DialogTrigger = React.forwardRef<HTMLButtonElement, DialogTriggerProps>(
  ({ asChild = false, children }, ref) => {
    const { onOpenChange } = React.useContext(DialogContext);
    
    const handleClick = () => {
      onOpenChange(true);
    };

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {
        onClick: handleClick,
        ref,
        ...children.props
      });
    }

    return (
      <button ref={ref} onClick={handleClick}>
        {children}
      </button>
    );
  }
);

DialogTrigger.displayName = "DialogTrigger";

interface DialogCloseProps {
  asChild?: boolean;
  children: React.ReactNode;
}

export const DialogClose = React.forwardRef<HTMLButtonElement, DialogCloseProps>(
  ({ asChild = false, children }, ref) => {
    const { onOpenChange } = React.useContext(DialogContext);
    
    const handleClick = () => {
      onOpenChange(false);
    };

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {
        onClick: handleClick,
        ref,
        ...children.props
      });
    }

    return (
      <button ref={ref} onClick={handleClick}>
        {children}
      </button>
    );
  }
);

DialogClose.displayName = "DialogClose";

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
}

export const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div 
        ref={ref}
        className={`bg-white rounded-lg shadow-lg w-full max-w-md mx-auto overflow-auto p-6 ${className || ""}`}
        role="dialog"
        aria-modal="true"
        {...props}
      >
        {children}
      </div>
    );
  }
);

DialogContent.displayName = "DialogContent";

interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
}

export const DialogHeader = React.forwardRef<HTMLDivElement, DialogHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div 
        ref={ref}
        className={`flex flex-col space-y-1.5 text-center sm:text-left mb-4 ${className || ""}`} 
        {...props}
      >
        {children}
      </div>
    );
  }
);

DialogHeader.displayName = "DialogHeader";

interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  className?: string;
  children?: React.ReactNode;
}

export const DialogTitle = React.forwardRef<HTMLHeadingElement, DialogTitleProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <h3 
        ref={ref}
        className={`text-lg font-semibold leading-none tracking-tight ${className || ""}`} 
        {...props}
      >
        {children}
      </h3>
    );
  }
);

DialogTitle.displayName = "DialogTitle";

interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  className?: string;
  children?: React.ReactNode;
}

export const DialogDescription = React.forwardRef<HTMLParagraphElement, DialogDescriptionProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={`text-sm text-muted-foreground ${className || ""}`}
        {...props}
      >
        {children}
      </p>
    );
  }
);

DialogDescription.displayName = "DialogDescription";

interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
}

export const DialogFooter = React.forwardRef<HTMLDivElement, DialogFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 ${className || ""}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

DialogFooter.displayName = "DialogFooter";
