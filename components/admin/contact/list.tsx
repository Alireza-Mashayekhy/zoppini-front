'use client';

import { Eye, Mail, MessageCircle, Phone, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useContacts,
  useDeleteContact,
} from '@/services/features/contact/hooks';
import type { Contact } from '@/services/features/contact/types';

export default function ContactList() {
  const { data, isLoading } = useContacts();

  const deleteMutation = useDeleteContact();

  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);

  const contacts = data;

  const handleDelete = () => {
    if (!contactToDelete) {
      return;
    }

    deleteMutation.mutate(contactToDelete.id, {
      onSuccess: () => {
        toast.success('پیام با موفقیت حذف شد.');

        setContactToDelete(null);

        if (selectedContact?.id === contactToDelete.id) {
          setSelectedContact(null);
        }
      },

      onError: (error: any) => {
        toast.error(
          error?.response?.data?.message ||
            error?.message ||
            'حذف پیام با خطا مواجه شد.',
        );
      },
    });
  };

  if (isLoading) {
    return <ContactTableSkeleton />;
  }

  return (
    <>
      <Card>
        <CardContent>
          {contacts?.data?.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">نام</TableHead>

                    <TableHead className="text-right">شماره تماس</TableHead>

                    <TableHead className="text-right">ایمیل</TableHead>

                    <TableHead className="text-right">تاریخ</TableHead>

                    <TableHead className="w-[150px] text-center">
                      عملیات
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {contacts?.data?.map(contact => (
                    <TableRow key={contact.id}>
                      {/* Name */}
                      <TableCell>
                        <div className="font-medium">{contact.name}</div>
                      </TableCell>

                      {/* Phone */}
                      <TableCell>
                        <a
                          href={`tel:${contact.phone}`}
                          dir="ltr"
                          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <Phone className="h-3.5 w-3.5" />

                          {contact.phone}
                        </a>
                      </TableCell>

                      {/* Email */}
                      <TableCell>
                        {contact.email ? (
                          <a
                            href={`mailto:${contact.email}`}
                            dir="ltr"
                            className="inline-flex max-w-[220px] items-center gap-1.5 truncate text-sm text-muted-foreground transition-colors hover:text-foreground"
                          >
                            <Mail className="h-3.5 w-3.5 shrink-0" />

                            <span className="truncate">{contact.email}</span>
                          </a>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>

                      {/* Date */}
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(contact.createdAt)}
                        </span>
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          {/* View */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            title="مشاهده پیام"
                            onClick={() => setSelectedContact(contact)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {/* Delete */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            title="حذف پیام"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setContactToDelete(contact)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ================================================= */}
      {/* Message Dialog */}
      {/* ================================================= */}

      <Dialog
        open={!!selectedContact}
        onOpenChange={open => {
          if (!open) {
            setSelectedContact(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl" dir="rtl">
          {selectedContact && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  پیام {selectedContact.name}
                </DialogTitle>

                <DialogDescription>
                  پیام ارسال‌شده از طریق فرم تماس با ما
                </DialogDescription>
              </DialogHeader>

              {/* Contact Info */}
              <div className="grid grid-cols-1 gap-3 rounded-lg bg-muted/50 p-4 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">نام</p>

                  <p className="text-sm font-medium">{selectedContact.name}</p>
                </div>

                <div>
                  <p className="mb-1 text-xs text-muted-foreground">
                    شماره تماس
                  </p>

                  <a
                    href={`tel:${selectedContact.phone}`}
                    dir="ltr"
                    className="block text-right text-sm font-medium hover:underline"
                  >
                    {selectedContact.phone}
                  </a>
                </div>

                <div>
                  <p className="mb-1 text-xs text-muted-foreground">ایمیل</p>

                  {selectedContact.email ? (
                    <a
                      href={`mailto:${selectedContact.email}`}
                      dir="ltr"
                      className="block truncate text-right text-sm font-medium hover:underline"
                    >
                      {selectedContact.email}
                    </a>
                  ) : (
                    <p className="text-sm text-muted-foreground">ثبت نشده</p>
                  )}
                </div>

                <div>
                  <p className="mb-1 text-xs text-muted-foreground">
                    تاریخ ارسال
                  </p>

                  <p className="text-sm font-medium">
                    {formatDate(selectedContact.createdAt)}
                  </p>
                </div>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <p className="text-sm font-medium">متن پیام</p>

                <div className="max-h-[350px] overflow-y-auto rounded-lg border bg-background p-4">
                  <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                    {selectedContact.message}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedContact(null)}
                >
                  بستن
                </Button>

                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    setContactToDelete(selectedContact);
                    setSelectedContact(null);
                  }}
                >
                  <Trash2 className="ml-2 h-4 w-4" />
                  حذف پیام
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ================================================= */}
      {/* Delete Confirmation */}
      {/* ================================================= */}

      <AlertDialog
        open={!!contactToDelete}
        onOpenChange={open => {
          if (!open && !deleteMutation.isPending) {
            setContactToDelete(null);
          }
        }}
      >
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف پیام</AlertDialogTitle>

            <AlertDialogDescription>
              آیا از حذف پیام{' '}
              <span className="font-medium text-foreground">
                {contactToDelete?.name}
              </span>{' '}
              مطمئن هستید؟
              <br />
              این عملیات قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              انصراف
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'در حال حذف...' : 'حذف پیام'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/* ================================================= */
/* Empty State */
/* ================================================= */

function EmptyState() {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <MessageCircle className="h-6 w-6 text-muted-foreground" />
      </div>

      <h3 className="font-medium">پیامی وجود ندارد</h3>

      <p className="mt-1 text-sm text-muted-foreground">
        هنوز هیچ پیامی از بخش تماس با ما دریافت نشده است.
      </p>
    </div>
  );
}

/* ================================================= */
/* Loading */
/* ================================================= */

function ContactTableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />

        <Skeleton className="mt-2 h-4 w-64" />
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ================================================= */
/* Date */
/* ================================================= */

function formatDate(date: string) {
  return new Intl.DateTimeFormat('fa-IR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
}
