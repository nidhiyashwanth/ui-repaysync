import axios from "axios";
import {
  User,
  Hierarchy,
  Customer,
  Loan,
  Payment,
  Interaction,
  FollowUp,
} from "@/lib/types";

// Define pagination response type
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Define token response types
export interface TokenResponse {
  access: string;
  refresh: string;
}

export interface TokenRefreshResponse {
  access: string;
}

const API_URL = "http://localhost:8000/api/";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      // Use Bearer for JWT tokens
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If unauthorized and not already retrying and refresh token exists
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      localStorage.getItem("refreshToken")
    ) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem("refreshToken");
        const response = await axios.post(`${API_URL}token/refresh/`, {
          refresh: refreshToken,
        });

        // Store the new token
        localStorage.setItem("token", response.data.access);

        // Update the authorization header
        originalRequest.headers[
          "Authorization"
        ] = `Bearer ${response.data.access}`;

        // Retry the request
        return axios(originalRequest);
      } catch (refreshError) {
        // If refresh fails, redirect to login
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Authentication Services
export const authService = {
  login: async (username: string, password: string): Promise<TokenResponse> => {
    const response = await api.post<TokenResponse>("token/", {
      username,
      password,
    });
    // Store both access and refresh tokens
    localStorage.setItem("token", response.data.access);
    localStorage.setItem("refreshToken", response.data.refresh);
    return response.data;
  },
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>("users/me/");
    return response.data;
  },
  refreshToken: async (refreshToken: string): Promise<TokenRefreshResponse> => {
    const response = await api.post<TokenRefreshResponse>("token/refresh/", {
      refresh: refreshToken,
    });
    localStorage.setItem("token", response.data.access);
    return response.data;
  },
  verifyToken: async (token: string): Promise<void> => {
    await api.post("token/verify/", { token });
  },
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
  },
};

// Define types for request payloads
export interface CreateUserPayload {
  username: string;
  password: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: string;
  is_active: boolean;
}

export interface UpdateUserPayload {
  username?: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  role?: string;
  is_active?: boolean;
}

// User Services
export const userService = {
  getAll: async (params?: any): Promise<PaginatedResponse<User>> => {
    const response = await api.get<PaginatedResponse<User>>("users/", {
      params,
    });
    return response.data;
  },
  getById: async (id: string): Promise<User> => {
    const response = await api.get<User>(`users/${id}/`);
    return response.data;
  },
  create: async (user: CreateUserPayload): Promise<User> => {
    const response = await api.post<User>("users/", user);
    return response.data;
  },
  update: async (id: string, user: UpdateUserPayload): Promise<User> => {
    const response = await api.patch<User>(`users/${id}/`, user);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`users/${id}/`);
  },
};

// Define types for hierarchy payloads
export interface CreateHierarchyPayload {
  manager: string;
  collection_officer: string;
}

export interface UpdateHierarchyPayload {
  manager?: string;
  collection_officer?: string;
}

// Hierarchy Services
export const hierarchyService = {
  getAll: async (params?: any): Promise<PaginatedResponse<Hierarchy>> => {
    const response = await api.get<PaginatedResponse<Hierarchy>>(
      "hierarchies/",
      { params }
    );
    return response.data;
  },
  getById: async (id: string): Promise<Hierarchy> => {
    const response = await api.get<Hierarchy>(`hierarchies/${id}/`);
    return response.data;
  },
  create: async (hierarchy: CreateHierarchyPayload): Promise<Hierarchy> => {
    const response = await api.post<Hierarchy>("hierarchies/", hierarchy);
    return response.data;
  },
  update: async (
    id: string,
    hierarchy: UpdateHierarchyPayload
  ): Promise<Hierarchy> => {
    const response = await api.patch<Hierarchy>(
      `hierarchies/${id}/`,
      hierarchy
    );
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`hierarchies/${id}/`);
  },
};

// Define types for customer payloads
export interface CreateCustomerPayload {
  first_name: string;
  last_name: string;
  gender: string;
  date_of_birth?: string;
  national_id?: string;
  primary_phone: string;
  secondary_phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  branch?: string;
  employer?: string;
  job_title?: string;
  monthly_income?: number;
  assigned_officer?: string;
  notes?: string;
  is_active: boolean;
}

export interface UpdateCustomerPayload {
  first_name?: string;
  last_name?: string;
  gender?: string;
  date_of_birth?: string;
  national_id?: string;
  primary_phone?: string;
  secondary_phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  branch?: string;
  employer?: string;
  job_title?: string;
  monthly_income?: number;
  assigned_officer?: string;
  notes?: string;
  is_active?: boolean;
}

// Customer Services
export const customerService = {
  getAll: async (params?: any): Promise<PaginatedResponse<Customer>> => {
    const response = await api.get<PaginatedResponse<Customer>>("customers/", {
      params,
    });
    return response.data;
  },
  getById: async (id: string): Promise<Customer> => {
    const response = await api.get<Customer>(`customers/${id}/`);
    return response.data;
  },
  create: async (customer: CreateCustomerPayload): Promise<Customer> => {
    const response = await api.post<Customer>("customers/", customer);
    return response.data;
  },
  update: async (
    id: string,
    customer: UpdateCustomerPayload
  ): Promise<Customer> => {
    const response = await api.patch<Customer>(`customers/${id}/`, customer);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`customers/${id}/`);
  },
  getLoans: async (id: string): Promise<PaginatedResponse<Loan>> => {
    const response = await api.get<PaginatedResponse<Loan>>(
      `customers/${id}/loans/`
    );
    return response.data;
  },
  getInteractions: async (
    id: string
  ): Promise<PaginatedResponse<Interaction>> => {
    const response = await api.get<PaginatedResponse<Interaction>>(
      `customers/${id}/interactions/`
    );
    return response.data;
  },
};

// Define types for loan payloads
export interface CreateLoanPayload {
  customer: string;
  principal_amount: number;
  interest_rate: number;
  term_months: number;
  payment_frequency: string;
  application_date: string;
  first_payment_date?: string;
  assigned_officer?: string;
  notes?: string;
}

export interface UpdateLoanPayload {
  customer?: string;
  principal_amount?: number;
  interest_rate?: number;
  term_months?: number;
  payment_frequency?: string;
  application_date?: string;
  first_payment_date?: string;
  assigned_officer?: string;
  notes?: string;
}

export interface ApproveLoanPayload {
  approval_date: string;
  disbursement_date: string;
}

export interface RestructureLoanPayload {
  new_maturity_date: string;
  new_interest_rate?: number;
  notes?: string;
}

export interface WriteOffLoanPayload {
  reason: string;
  notes?: string;
}

// Loan Services
export const loanService = {
  getAll: async (params?: any): Promise<PaginatedResponse<Loan>> => {
    const response = await api.get<PaginatedResponse<Loan>>("loans/", {
      params,
    });
    return response.data;
  },
  getById: async (id: string): Promise<Loan> => {
    const response = await api.get<Loan>(`loans/${id}/`);
    return response.data;
  },
  create: async (loan: CreateLoanPayload): Promise<Loan> => {
    const response = await api.post<Loan>("loans/", loan);
    return response.data;
  },
  update: async (id: string, loan: UpdateLoanPayload): Promise<Loan> => {
    const response = await api.patch<Loan>(`loans/${id}/`, loan);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`loans/${id}/`);
  },
  getPayments: async (id: string): Promise<PaginatedResponse<Payment>> => {
    const response = await api.get<PaginatedResponse<Payment>>(
      `loans/${id}/payments/`
    );
    return response.data;
  },
  approve: async (id: string, data: ApproveLoanPayload): Promise<Loan> => {
    const response = await api.post<Loan>(`loans/${id}/approve/`, data);
    return response.data;
  },
  restructure: async (
    id: string,
    data: RestructureLoanPayload
  ): Promise<Loan> => {
    const response = await api.post<Loan>(`loans/${id}/restructure/`, data);
    return response.data;
  },
  writeOff: async (id: string, data: WriteOffLoanPayload): Promise<Loan> => {
    const response = await api.post<Loan>(`loans/${id}/write_off/`, data);
    return response.data;
  },
};

// Define types for payment payloads
export interface CreatePaymentPayload {
  loan: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  payment_reference?: string;
  received_by?: string;
  notes?: string;
}

export interface UpdatePaymentPayload {
  loan?: string;
  amount?: number;
  payment_date?: string;
  payment_method?: string;
  payment_reference?: string;
  received_by?: string;
  notes?: string;
}

// Payment Services
export const paymentService = {
  getAll: async (params?: any): Promise<PaginatedResponse<Payment>> => {
    const response = await api.get<PaginatedResponse<Payment>>("payments/", {
      params,
    });
    return response.data;
  },
  getById: async (id: string): Promise<Payment> => {
    const response = await api.get<Payment>(`payments/${id}/`);
    return response.data;
  },
  create: async (payment: CreatePaymentPayload): Promise<Payment> => {
    const response = await api.post<Payment>("payments/", payment);
    return response.data;
  },
  update: async (
    id: string,
    payment: UpdatePaymentPayload
  ): Promise<Payment> => {
    const response = await api.patch<Payment>(`payments/${id}/`, payment);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`payments/${id}/`);
  },
};

// Define types for interaction payloads
export interface CreateInteractionPayload {
  customer: string;
  loan?: string;
  interaction_type: string;
  contact_number?: string;
  contact_person?: string;
  start_time: string;
  end_time?: string;
  outcome?: string;
  notes: string;
  payment_promise_amount?: number;
  payment_promise_date?: string;
}

export interface CreateFollowUpPayload {
  follow_up_type: string;
  scheduled_date: string;
  scheduled_time?: string;
  assigned_to: string;
  notes?: string;
  priority: string;
}

// Interaction Services
export const interactionService = {
  getAll: async (params?: any): Promise<PaginatedResponse<Interaction>> => {
    const response = await api.get<PaginatedResponse<Interaction>>(
      "interactions/",
      { params }
    );
    return response.data;
  },
  getById: async (id: string): Promise<Interaction> => {
    const response = await api.get<Interaction>(`interactions/${id}/`);
    return response.data;
  },
  create: async (
    interaction: CreateInteractionPayload
  ): Promise<Interaction> => {
    const response = await api.post<Interaction>("interactions/", interaction);
    return response.data;
  },
  createFollowUp: async (
    id: string,
    followUp: CreateFollowUpPayload
  ): Promise<FollowUp> => {
    const response = await api.post<FollowUp>(
      `interactions/${id}/create_follow_up/`,
      followUp
    );
    return response.data;
  },
};

// Define types for follow-up payloads
export interface CreateFollowUpStandalonePayload {
  customer: string;
  follow_up_type: string;
  scheduled_date: string;
  scheduled_time?: string;
  assigned_to: string;
  notes?: string;
  priority: string;
}

export interface UpdateFollowUpPayload {
  follow_up_type?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  assigned_to?: string;
  notes?: string;
  priority?: string;
}

export interface CompleteFollowUpPayload {
  result: string;
  notes?: string;
}

export interface RescheduleFollowUpPayload {
  scheduled_date: string;
  scheduled_time?: string;
  notes?: string;
}

// Follow-up Services
export const followUpService = {
  getAll: async (params?: any): Promise<PaginatedResponse<FollowUp>> => {
    const response = await api.get<PaginatedResponse<FollowUp>>("follow-ups/", {
      params,
    });
    return response.data;
  },
  getById: async (id: string): Promise<FollowUp> => {
    const response = await api.get<FollowUp>(`follow-ups/${id}/`);
    return response.data;
  },
  create: async (
    followUp: CreateFollowUpStandalonePayload
  ): Promise<FollowUp> => {
    const response = await api.post<FollowUp>("follow-ups/", followUp);
    return response.data;
  },
  update: async (
    id: string,
    followUp: UpdateFollowUpPayload
  ): Promise<FollowUp> => {
    const response = await api.patch<FollowUp>(`follow-ups/${id}/`, followUp);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`follow-ups/${id}/`);
  },
  complete: async (
    id: string,
    data: CompleteFollowUpPayload
  ): Promise<FollowUp> => {
    const response = await api.post<FollowUp>(
      `follow-ups/${id}/complete/`,
      data
    );
    return response.data;
  },
  reschedule: async (
    id: string,
    data: RescheduleFollowUpPayload
  ): Promise<FollowUp> => {
    const response = await api.post<FollowUp>(
      `follow-ups/${id}/reschedule/`,
      data
    );
    return response.data;
  },
};

export default api;
