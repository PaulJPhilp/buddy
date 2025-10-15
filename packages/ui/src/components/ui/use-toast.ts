import { toast as sonnerToast } from "sonner";

export const toast: typeof sonnerToast = sonnerToast;

export function useToast(): { toast: typeof sonnerToast } {
  return {
    toast: sonnerToast,
  };
}
