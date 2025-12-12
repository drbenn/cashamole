import type { ExternalToast } from "vue-sonner";

export interface ApiResponse {
  success: boolean
  data?: any
  error?: any
}

export interface ToastPayload extends ExternalToast {
  message: string;
  type?: 'default' | 'success' | 'error' | 'warning' | 'info'
  // Note: Position is now implicitly included via ExternalToast, but you could explicitly 
  // redefine it here for clarity if you wanted:
  // position?: Position; 
}