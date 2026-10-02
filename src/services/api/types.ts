// Reaproveitado diretamente do pktracker-front
export interface User {
  name: string;
  email: string;
  createdAt?: string;
  bank: Bank;
}

export interface Deposit {
  id: string;
  date: string;
  amount: number;
}

export interface Withdrawal {
  id: string;
  date: string;
  amount: number;
}

export interface Rake {
  id: string;
  date: string;
  amount: number;
}

interface Bank {
  id: string;
  userId: string;
  bank: number;
  totalDeposit: number;
  totalWithdrawal: number;
  totalRake: number;
  profit: number;
  deposits: Deposit[];
  withdrawals: Withdrawal[];
  rakes: Rake[];
}

export interface CreateUserRequest {
  name: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}
