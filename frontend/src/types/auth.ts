export interface User {
  id: string;
  name: string;
  email: string;
  role: 'patient' | 'admin';
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: 'patient' | 'admin';
}

export interface LoginResponse {
  user: User;
  token: string;
}