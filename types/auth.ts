export type AuthResponse = {
  token: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    role: string;
    reporterStatus: string;
    createdAt: string;
  };
};
