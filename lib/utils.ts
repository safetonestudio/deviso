import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Assistant de classes utilise par les composants shadcn/ui.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
