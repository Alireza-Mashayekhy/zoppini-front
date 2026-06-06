'use client';

import { MoreHorizontalIcon } from 'lucide-react';
import { useState } from 'react';

import CustomPagination from '@/components/shared/custom-pagination';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useDebounce } from '@/hooks/use-debounce';
import { useUsersList } from '@/services/features/users/hooks';
import { UserResponse } from '@/services/features/users/types';

export default function Users() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const debouncedSearch = useDebounce(search, 500);

  const { data } = useUsersList({
    page,
    search: debouncedSearch,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <Button>افزودن</Button>
        <Input
          placeholder="جستجو"
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="bg-white w-96"
        />
      </div>
      <div className="bg-white rounded-sm">
        <Table dir="rtl">
          <TableHeader>
            <TableRow>
              <TableHead>آیدی</TableHead>
              <TableHead>نام و نام خانوادگی</TableHead>
              <TableHead>شماره تلفن</TableHead>
              <TableHead>تاریخ تولد</TableHead>
              <TableHead>نقش</TableHead>
              <TableHead>عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.data.map((user: UserResponse) => (
              <TableRow key={user.id}>
                <TableCell>{user.id}</TableCell>
                <TableCell>{user.fullName}</TableCell>
                <TableCell>{user.phone}</TableCell>
                <TableCell>{user.birthDate}</TableCell>
                <TableCell>{user.roles.map((role: string) => role)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8">
                        <MoreHorizontalIcon />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem>Duplicate</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive">
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={6}>
                <CustomPagination
                  totalPages={data?.pagination?.totalPages ?? 1}
                  currentPage={page}
                  onPageChange={setPage}
                />
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}
