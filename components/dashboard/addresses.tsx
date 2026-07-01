// components/dashboard/addresses.tsx
'use client';

import { Edit, MapPin, Plus, Star, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  useAddresses,
  useDeleteAddress,
  useSetDefaultAddress,
} from '@/services/features/addresses/hooks';

import AddressForm from './address-form';

interface AddressesProps {
  mode?: 'default' | 'checkout';
  selectedAddressId?: number;
  onAddressSelect?: (addressId: number) => void;
}

export default function Addresses({
  mode = 'default',
  selectedAddressId,
  onAddressSelect,
}: AddressesProps) {
  const { data: addresses, isLoading } = useAddresses();
  const deleteAddress = useDeleteAddress();
  const setDefault = useSetDefaultAddress();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-light tracking-wide">
          {mode === 'checkout' ? 'انتخاب آدرس' : 'آدرس‌های من'}
        </h2>
        {mode === 'default' && (
          <Button variant="dark" size="sm" onClick={() => setIsFormOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> افزودن آدرس
          </Button>
        )}
      </div>

      {!addresses?.data || addresses?.data?.length === 0 ? (
        <div className="text-center py-12 text-gray-500 border-2 border-dashed rounded-lg">
          <MapPin className="w-12 h-12 mx-auto stroke-1 text-gray-300 mb-2" />
          <p>هیچ آدرسی ثبت نشده است</p>
          {mode === 'default' && (
            <Button
              variant="dark"
              size="sm"
              className="mt-2"
              onClick={() => setIsFormOpen(true)}
            >
              افزودن آدرس جدید
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses?.data?.map(address => {
            const isSelected =
              mode === 'checkout' && selectedAddressId === address.id;

            return (
              <div
                key={address.id}
                onClick={() => {
                  if (mode === 'checkout' && onAddressSelect) {
                    onAddressSelect(address.id);
                  }
                }}
                className={cn(
                  'relative border rounded-lg p-4 transition-all cursor-pointer',
                  address.isDefault && !isSelected
                    ? 'border-gray-400 bg-gray-50'
                    : 'border-gray-200',
                  isSelected && 'border-black ring-2 ring-black ring-offset-2',
                  mode === 'checkout' && !isSelected && 'hover:border-gray-400',
                )}
              >
                {/* نشان پیش‌فرض */}
                {address.isDefault && (
                  <span className="absolute top-2 right-2 text-xs bg-gray-800 text-white px-2 py-0.5 rounded-full">
                    پیش‌فرض
                  </span>
                )}

                {/* نشان انتخاب در checkout */}
                {isSelected && (
                  <span className="absolute top-2 left-2 text-xs bg-gray-800 text-white px-2 py-0.5 rounded-full">
                    انتخاب شده
                  </span>
                )}

                {/* اطلاعات آدرس */}
                <div className="mt-4">
                  <p className="text-sm text-gray-600">
                    {address.province?.name}، {address.city?.name}
                  </p>
                  <p className="text-sm text-gray-600">{address.address}</p>
                  {address.postalCode && (
                    <p className="text-sm text-gray-500 mt-1">
                      کدپستی: {address.postalCode}
                    </p>
                  )}
                </div>

                {/* دکمه‌های عملیات */}
                {mode === 'default' && (
                  <div className="flex gap-1 mt-3 pt-3 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      onClick={e => {
                        e.stopPropagation();
                        setEditingAddress(address);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    {!address.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        onClick={e => {
                          e.stopPropagation();
                          setDefault.mutate(address.id);
                        }}
                      >
                        <Star className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-red-500 hover:text-red-700"
                      onClick={e => {
                        e.stopPropagation();
                        if (confirm('آیا از حذف این آدرس مطمئنید؟')) {
                          deleteAddress.mutate(address.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* فرم افزودن/ویرایش */}
      <AddressForm
        open={isFormOpen || !!editingAddress}
        onClose={() => {
          setIsFormOpen(false);
          setEditingAddress(null);
        }}
        initialData={editingAddress}
      />
    </div>
  );
}
