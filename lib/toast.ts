import { toast as sonnerToast } from "sonner";

export function toastSuccess(message: string, description?: string) {
  sonnerToast.success(message, description ? { description } : undefined);
}

export function toastError(message: string, description?: string) {
  sonnerToast.error(message, description ? { description } : undefined);
}

export function toastWarning(message: string, description?: string) {
  sonnerToast.warning(message, description ? { description } : undefined);
}

export { sonnerToast as toast };
