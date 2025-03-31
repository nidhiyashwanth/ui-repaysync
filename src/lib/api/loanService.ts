import { Loan, Payment } from "@/lib/types";
import { api } from "./api";

interface LoanFilter {
  search?: string;
  page?: number;
  page_size?: number;
  status?: string;
  customer?: string;
  assigned_officer?: string;
  ordering?: string;
}

interface LoanResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Loan[];
}

const getAll = async (filters: LoanFilter = {}): Promise<LoanResponse> => {
  const response = await api.get("/loans/", { params: filters });
  return response.data;
};

const getById = async (id: string): Promise<Loan> => {
  const response = await api.get(`/loans/${id}/`);
  return response.data;
};

const create = async (loan: Partial<Loan>): Promise<Loan> => {
  const response = await api.post("/loans/", loan);
  return response.data;
};

const update = async (id: string, loan: Partial<Loan>): Promise<Loan> => {
  const response = await api.put(`/loans/${id}/`, loan);
  return response.data;
};

const remove = async (id: string): Promise<void> => {
  await api.delete(`/loans/${id}/`);
};

const getPayments = async (loanId: string): Promise<Payment[]> => {
  const response = await api.get(`/loans/${loanId}/payments/`);
  return response.data;
};

const recordPayment = async (
  loanId: string,
  payment: Partial<Payment>
): Promise<Payment> => {
  const response = await api.post(`/loans/${loanId}/payments/`, payment);
  return response.data;
};

export const loanService = {
  getAll,
  getById,
  create,
  update,
  remove,
  getPayments,
  recordPayment,
};
