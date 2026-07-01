import { api } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import { ApiListResponse, ApiSingleResponse } from '@/services/api/types';

import { AddressResponse, CreateAddressDto, UpdateAddressDto } from './types';

export const getAddresses = async (): Promise<
  ApiListResponse<AddressResponse>
> => {
  const { data } = await api.get(endpoints.addresses.list);
  return data;
};

export const createAddress = async (
  dto: CreateAddressDto,
): Promise<ApiSingleResponse<AddressResponse>> => {
  const { data } = await api.post(endpoints.addresses.create, dto);
  return data;
};

export const updateAddress = async (
  id: number,
  dto: UpdateAddressDto,
): Promise<ApiSingleResponse<AddressResponse>> => {
  const url = endpoints.addresses.update(id);
  const { data } = await api.patch(url, dto);
  return data;
};

export const deleteAddress = async (id: number): Promise<void> => {
  const url = endpoints.addresses.delete(id);

  await api.delete(url);
};

export const setDefaultAddress = async (
  id: number,
): Promise<AddressResponse> => {
  const url = endpoints.addresses.setDefault(id);

  const { data } = await api.patch(url);
  return data;
};
