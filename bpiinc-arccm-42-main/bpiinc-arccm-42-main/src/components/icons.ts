
import { Github, Mail, type LucideIcon } from "lucide-react";

export type Icon = LucideIcon;

export const Icons = {
  gitHub: Github,
  google: Mail, // Using Mail icon as a temporary replacement for Google
} as const;

