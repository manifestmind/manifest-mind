// Global type definitions

export interface User {
  id: string;
  email: string;
  displayName?: string;
  // Add other user properties as needed
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export interface AppState {
  isLoading: boolean;
  user: User | null;
  onboardingCompleted: boolean;
}