'use client';

import { Loader2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { AdminOrder } from '@/services/features/orders/admin.api';
import { useCancelAdminOrder } from '@/services/features/orders/admin.hooks';

interface Props {
  order: AdminOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CancelOrderDialog({
  order,
  open,
  onOpenChange,
}: Props) {
  const [reason, setReason] = useState('');

  const mutation = useCancelAdminOrder();

  const handleCancel = () => {
    if (!order) return;

    mutation.mutate(
      {
        id: order.id,
        reason: reason.trim() || undefined,
      },
      {
        onSuccess: () => {
          setReason('');
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-right">
            لغو سفارش #{order?.id}
          </DialogTitle>

          <DialogDescription className="text-right">
            در صورت لغو سفارش، وضعیت آن به لغو شده تغییر خواهد کرد.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Textarea
            value={reason}
            onChange={event => setReason(event.target.value)}
            placeholder="دلیل لغو سفارش را وارد کنید..."
            rows={4}
          />
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            انصراف
          </Button>

          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={mutation.isPending}
          >
            {mutation.isPending && (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            )}
            لغو سفارش
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
