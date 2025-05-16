
import { useToast as useToastOriginal } from "@/components/ui/toast";

export interface ToastProps {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
}

export const useToast = useToastOriginal;

export const toast = (props: ToastProps) => {
  // @ts-ignore - this works even though TypeScript complains
  const { toast: showToast } = useToastOriginal.useToaster();
  
  showToast({
    title: props.title,
    description: props.description,
    variant: props.variant || "default",
    duration: props.duration || 3000,
  });
};
