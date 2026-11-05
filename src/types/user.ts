export interface User {
  _id: string;
  studentId: string;
  fullName: string;
  email: string;
  point: number;
  role: 'student' | 'admin';
  faculty?: string;
  avatarUrl?: string;
  phone?: string;
  status?: 'active' | 'inactive';
  isActive?: boolean;
  createdAt?: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  studentId: string;
  fullName: string;
  email: string;
  password: string;
  faculty?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface CreateUserPayload {
  studentId: string;
  fullName: string;
  email: string;
  role: 'student' | 'admin';
  faculty?: string;
  point?: number;
  phone?: string;
  password?: string;
}

export interface UpdateUserPayload {
  fullName?: string;
  faculty?: string;
  phone?: string;
  point?: number;
  role?: 'student' | 'admin';
  status?: 'active' | 'inactive';
  isActive?: boolean;
}
