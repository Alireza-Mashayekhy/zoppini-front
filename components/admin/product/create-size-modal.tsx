import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useCreateSize } from '@/services/features/products/hooks';
import { CreateSizeDto } from '@/services/features/products/type';

import FormProvider from '../../form/form-provider';
import RHFInput from '../../form/rhf-input';
import { Button } from '../../ui/button';

export default function CreateSizeModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const createSizeMutation = useCreateSize();

  const schema = z.object({
    name: z.string().nonempty('این فیلد اجباری است'),
  });

  const methods = useForm<CreateSizeDto>({
    defaultValues: {
      name: '',
    },
    resolver: zodResolver(schema),
  });

  const { reset } = methods;

  const onSubmit = async (data: CreateSizeDto) => {
    try {
      await createSizeMutation.mutateAsync(data);
      toast.success('سایز با موفقیت ساخته شد');
      onOpenChange(false);
      reset();
      queryClient.invalidateQueries({ queryKey: ['sizes'] });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger>
          <Button>افزودن</Button>
        </DialogTrigger>
        <DialogContent className="flex flex-col gap-10">
          <DialogHeader className="h-fit">
            <DialogTitle>افزودن سایز</DialogTitle>
          </DialogHeader>

          <FormProvider methods={methods} onSubmit={onSubmit}>
            <div className="flex flex-col gap-4 overflow-y-auto scrollbar-thin px-4">
              <RHFInput label="نام سایز" name="name" isRequired />

              <Button
                type="submit"
                loading={createSizeMutation.isPending}
                size="lg"
                className="w-full col-span-2"
              >
                ثبت سایز
              </Button>
            </div>
          </FormProvider>
        </DialogContent>
      </Dialog>
    </>
  );
}
