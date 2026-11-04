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
