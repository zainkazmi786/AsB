const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: Array<{ field: string; message: string }>;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Get token from localStorage
    const token = localStorage.getItem('auth_token');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data: ApiResponse<T> = await response.json();

      // If unauthorized, clear token and redirect to login
      if (response.status === 401 && token) {
        localStorage.removeItem('auth_token');
        window.location.href = '/';
      }

      return data;
    } catch (error) {
      console.error('API request error:', error);
      return {
        success: false,
        message: 'نیٹ ورک کی خرابی',
        error: 'NETWORK_ERROR',
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

// Auth API endpoints
export const authApi = {
  login: async (username: string, password: string) => {
    return apiClient.post<{
      token: string;
      user: {
        id: string;
        name: string;
        username: string;
        role: 'admin' | 'accountant' | 'viewer';
      };
    }>('/auth/login', { username, password });
  },

  verify: async () => {
    return apiClient.post<{
      user: {
        id: string;
        name: string;
        username: string;
        role: 'admin' | 'accountant' | 'viewer';
      };
    }>('/auth/verify');
  },
};

// Donor API endpoints
export interface Donor {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  totalDonations: number;
  lastDonationDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DonorListResponse {
  donors: Donor[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface DonorDetailResponse {
  donor: Donor & {
    donations?: Array<{
      date: string;
      category: string;
      amount: number;
      receiptNumber: string;
      paymentMethod?: string;
    }>;
  };
}

export const donorsApi = {
  getAll: async (search = '', page = 1, limit = 10) => {
    const params = new URLSearchParams({
      search,
      page: page.toString(),
      limit: limit.toString(),
    });
    return apiClient.get<DonorListResponse>(`/donors?${params.toString()}`);
  },

  getById: async (id: string) => {
    return apiClient.get<DonorDetailResponse>(`/donors/${id}`);
  },

  getDonations: async (id: string) => {
    return apiClient.get<{ donations: any[] }>(`/donors/${id}/donations`);
  },

  create: async (data: {
    name: string;
    phone: string;
    email?: string;
    address?: string;
  }) => {
    return apiClient.post<{ donor: Donor }>('/donors', data);
  },

  update: async (id: string, data: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
  }) => {
    return apiClient.put<{ donor: Donor }>(`/donors/${id}`, data);
  },

  delete: async (id: string) => {
    return apiClient.delete(`/donors/${id}`);
  },
};

// Donation API endpoints
export interface Donation {
  _id: string;
  id?: string;
  receiptNumber: string;
  donorId: string;
  donorName: string;
  date: string; // ISO date
  category: string;
  amount: number;
  paymentMethod: string;
  bankId?: string | null;
  remarks?: string;
  createdAt: string;
}

export interface DonationListResponse {
  donations: Donation[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface DonationOptionsResponse {
  categories: string[];
  paymentMethods: string[];
}

export const donationsApi = {
  getOptions: async () => {
    return apiClient.get<DonationOptionsResponse>('/donations/options');
  },

  getAll: async (search = '', category = '', page = 1, limit = 10) => {
    const params = new URLSearchParams({
      search,
      category: category === 'all' ? '' : category,
      page: page.toString(),
      limit: limit.toString(),
    });
    return apiClient.get<DonationListResponse>(`/donations?${params.toString()}`);
  },

  getById: async (id: string) => {
    return apiClient.get<{ donation: Donation }>(`/donations/${id}`);
  },

  create: async (data: {
    donorId: string;
    date: string;
    category: string;
    amount: number;
    paymentMethod: string;
    bankId?: string | null;
    remarks?: string;
  }) => {
    return apiClient.post<{ donation: Donation }>('/donations', data);
  },

  update: async (id: string, data: {
    donorId?: string;
    date?: string;
    category?: string;
    amount?: number;
    paymentMethod?: string;
    bankId?: string | null;
    remarks?: string;
  }) => {
    return apiClient.put<{ donation: Donation }>(`/donations/${id}`, data);
  },

  delete: async (id: string) => {
    return apiClient.delete(`/donations/${id}`);
  },
};

// Bank API endpoints
export interface Bank {
  _id: string;
  id?: string;
  bankName: string;
  accountName: string;
  name?: string;
  accountNumber: string;
  currentBalance?: number;
  balance?: number;
  isActive?: boolean;
  createdAt?: string;
}

export interface BankListResponse {
  banks: Bank[];
}

export interface BankTransaction {
  _id: string;
  bankId: string;
  type: 'credit' | 'debit';
  amount: number;
  source: string;
  referenceId: string;
  date: string;
  remarks?: string;
}

export const banksApi = {
  getAll: async () => {
    return apiClient.get<BankListResponse>('/finance/banks');
  },

  getById: async (id: string) => {
    return apiClient.get<{ bank: Bank }>(`/finance/banks/${id}`);
  },

  getTransactions: async (id: string, page = 1, limit = 20) => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    return apiClient.get<{ transactions: BankTransaction[]; pagination: any }>(
      `/finance/banks/${id}/transactions?${params}`
    );
  },

  create: async (data: { bankName: string; accountName: string; accountNumber: string }) => {
    return apiClient.post<{ bank: Bank }>('/finance/banks', data);
  },

  update: async (id: string, data: { bankName?: string; accountName?: string; accountNumber?: string }) => {
    return apiClient.put<{ bank: Bank }>(`/finance/banks/${id}`, data);
  },

  delete: async (id: string) => {
    return apiClient.delete(`/finance/banks/${id}`);
  },
};

// Expense API endpoints
export interface Expense {
  _id: string;
  id?: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  paymentSource: string;
  paidFrom: string;
  createdAt?: string;
}

export interface ExpenseListResponse {
  expenses: Expense[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface ExpenseOptionsResponse {
  categories: string[];
}

export const expensesApi = {
  getOptions: async () => {
    return apiClient.get<ExpenseOptionsResponse>('/finance/expenses/options');
  },

  getAll: async (page = 1, limit = 10, params?: { category?: string; dateFrom?: string; dateTo?: string }) => {
    const search = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (params?.category) search.set('category', params.category);
    if (params?.dateFrom) search.set('dateFrom', params.dateFrom);
    if (params?.dateTo) search.set('dateTo', params.dateTo);
    return apiClient.get<ExpenseListResponse>(`/finance/expenses?${search.toString()}`);
  },

  getById: async (id: string) => {
    return apiClient.get<{ expense: Expense }>(`/finance/expenses/${id}`);
  },

  create: async (data: {
    date: string;
    category: string;
    description?: string;
    amount: number;
    paymentSource: string;
  }) => {
    return apiClient.post<{ expense: Expense }>('/finance/expenses', data);
  },

  update: async (id: string, data: {
    date?: string;
    category?: string;
    description?: string;
    amount?: number;
    paymentSource?: string;
  }) => {
    return apiClient.put<{ expense: Expense }>(`/finance/expenses/${id}`, data);
  },

  delete: async (id: string) => {
    return apiClient.delete(`/finance/expenses/${id}`);
  },
};
