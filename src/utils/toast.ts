import { toast } from "sonner";

type ToastAction = {
  label: string;
  onClick: () => void;
};

interface ToastOptions {
  description: string;
  duration?: number;
  action?: ToastAction;
}

export const showToast = (title: string, options: ToastOptions) => {
  toast(title, {
    description: options.description,
    duration: options.duration || 5000,
    action: options.action,
  });
};
