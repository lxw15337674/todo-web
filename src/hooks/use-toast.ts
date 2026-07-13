'use client';

import type * as React from 'react';
import { toast as sonnerToast, type ExternalToast } from 'sonner';

type ToastOptions = ExternalToast & {
  title?: React.ReactNode;
  variant?: 'default' | 'destructive';
};

function toast({ title, description, variant, ...options }: ToastOptions) {
  const message = title ?? description ?? '';
  const toastOptions = {
    ...options,
    description: title ? description : undefined,
  };

  return variant === 'destructive'
    ? sonnerToast.error(message, toastOptions)
    : sonnerToast(message, toastOptions);
}

function useToast() {
  return { toast };
}

export { toast, useToast };
