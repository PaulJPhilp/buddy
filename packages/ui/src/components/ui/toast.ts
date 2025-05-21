import { ToasterProps as SonnerToasterProps, type ToastT } from "sonner";

export type ToastProps = ToastT;
export type ToasterProps = SonnerToasterProps;

export interface ToastActionElement {
  altText: string;
  onClick: () => void;
  children: React.ReactNode;
}

export { Toaster, toast } from "sonner";
