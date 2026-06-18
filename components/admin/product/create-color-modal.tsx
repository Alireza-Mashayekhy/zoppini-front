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
import { useCreateColor } from '@/services/features/products/hooks';
import { CreateColorDto } from '@/services/features/products/type';

import FormProvider from '../../form/form-provider';
import RHFInput from '../../form/rhf-input';
import { Button } from '../../ui/button';

export default function CreateColorModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const createColorMutation = useCreateColor();

  const schema = z.object({
    name: z.string().nonempty('این فیلد اجباری است'),
    hexCode: z.string().nonempty('این فیلد اجباری است'),
  });

  const methods = useForm<CreateColorDto>({
    defaultValues: {
      name: '',
      hexCode: '',
    },
    resolver: zodResolver(schema),
  });

  const { reset } = methods;

  const onSubmit = async (data: CreateColorDto) => {
    try {
      await createColorMutation.mutateAsync(data);
      toast.success('رنگ با موفقیت ساخته شد');
      onOpenChange(false);
      reset();
      queryClient.invalidateQueries({ queryKey: ['colors'] });
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
            <DialogTitle>افزودن رنگ</DialogTitle>
          </DialogHeader>

          <FormProvider methods={methods} onSubmit={onSubmit}>
            <div className="flex flex-col gap-4 overflow-y-auto scrollbar-thin px-4">
              <RHFInput label="نام رنگ" name="name" isRequired />
              <RHFInput type="color" label="کد رنگ" name="hexCode" isRequired />

              <Button
                type="submit"
                loading={createColorMutation.isPending}
                size="lg"
                className="w-full col-span-2"
              >
                ثبت رنگ
              </Button>
            </div>
          </FormProvider>
        </DialogContent>
      </Dialog>
    </>
  );
}
