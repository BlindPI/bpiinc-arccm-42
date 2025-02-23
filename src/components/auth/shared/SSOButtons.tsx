
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";

interface SSOButtonsProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SSOButtons({ className, ...props }: SSOButtonsProps) {
  return (
    <div className={cn("hidden", className)} {...props}>
      <div className="grid grid-cols-2 gap-6">
        <Button variant="outline" type="button" disabled>
          <Icons.gitHub className="mr-2 h-4 w-4" />
          Github
        </Button>
        <Button variant="outline" type="button" disabled>
          <Icons.google className="mr-2 h-4 w-4" />
          Google
        </Button>
      </div>
    </div>
  );
}
