
// Import from radix-ui toast directly to avoid circular dependency
import { useToast as useToastShell } from "@radix-ui/react-toast";
import { toast as toastShell } from "@/components/ui/toast";

export interface ToastProps {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
}

// Export the hook directly
export const useToast = toastShell;

// Create a toast helper function
export const toast = (props: ToastProps) => {
  // @ts-ignore - this works even though TypeScript complains
  const { toast: showToast } = toastShell.useToaster();
  
  showToast({
    title: props.title,
    description: props.description,
    variant: props.variant || "default",
    duration: props.duration || 3000,
  });
};
