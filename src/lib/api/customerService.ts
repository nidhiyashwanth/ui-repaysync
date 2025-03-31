import { Customer } from "@/lib/types";
import { api } from "./api";

interface CustomerFilter {
  search?: string;
  page?: number;
  page_size?: number;
  is_active?: boolean;
  assigned_officer?: string;
  ordering?: string;
}

interface CustomerResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Customer[];
}

const getAll = async (
  filters: CustomerFilter = {}
): Promise<CustomerResponse> => {
  const response = await api.get("/customers/", { params: filters });
  return response.data;
};

const getById = async (id: string): Promise<Customer> => {
  const response = await api.get(`/customers/${id}/`);
  return response.data;
};

const create = async (customer: Partial<Customer>): Promise<Customer> => {
  const response = await api.post("/customers/", customer);
  return response.data;
};

const update = async (
  id: string,
  customer: Partial<Customer>
): Promise<Customer> => {
  const response = await api.patch(`/customers/${id}/`, customer);
  return response.data;
};

const remove = async (id: string): Promise<void> => {
  await api.delete(`/customers/${id}/`);
};

const getCustomerLoans = async (customerId: string): Promise<any> => {
  const response = await api.get(`/customers/${customerId}/loans/`);
  return response.data;
};

const getCustomerInteractions = async (customerId: string): Promise<any> => {
  const response = await api.get(`/customers/${customerId}/interactions/`);
  return response.data;
};

export const customerService = {
  getAll,
  getById,
  create,
  update,
  remove,
  getCustomerLoans,
  getCustomerInteractions,
};
