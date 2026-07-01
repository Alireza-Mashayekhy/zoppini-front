import { City, Province } from '../locations/types';

export interface AddressResponse {
  id: number;
  userId: number;
  provinceId: number;
  cityId: number;
  province: Province;
  city: City;
  address: string;
  postalCode: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAddressDto {
  provinceId: number;
  cityId: number;
  address: string;
  postalCode?: string;
  isDefault?: boolean;
}

export type UpdateAddressDto = Partial<CreateAddressDto>;
