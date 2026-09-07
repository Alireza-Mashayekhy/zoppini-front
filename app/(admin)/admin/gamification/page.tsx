'use client';

import { MoreHorizontalIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';

import { QUESTIONS } from '@/app/gamification/page';
import CustomPagination from '@/components/shared/custom-pagination';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDebounce } from '@/hooks/use-debounce';
import { toPersianDate } from '@/lib/utils';
import {
  useGamificationList,
  useGamificationStats,
} from '@/services/features/gamification/hooks';
import { GamificationResponse } from '@/services/features/gamification/type';

export default function Users() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const [selectedInfo, setSelectedInfo] = useState<GamificationResponse | null>(
    null,
  );

  const [openModal, setOpenModal] = useState(false);

  const debouncedSearch = useDebounce(search, 500);

  const { data } = useGamificationList({
    search: debouncedSearch,
    page,
  });

  const { data: stats } = useGamificationStats();

  const handleInfo = (game: GamificationResponse) => {
    setSelectedInfo(game);
    setOpenModal(true);
  };

  const chartConfig = {
    count: {
      label: 'تعداد انتخاب',
    },
  } satisfies ChartConfig;

  const chartData = useMemo(() => {
    return (
      stats?.data?.questions?.map(question => ({
        question: `سوال ${question.questionNumber}`,
        option1:
          question.options?.find(option => option.optionNumber === 1)?.count ??
          0,
        option2:
          question.options?.find(option => option.optionNumber === 2)?.count ??
          0,
        option3:
          question.options?.find(option => option.optionNumber === 3)?.count ??
          0,
        option4:
          question.options?.find(option => option.optionNumber === 4)?.count ??
          0,
      })) ?? []
    );
  }, [stats]);

  const totalParticipants = stats?.data?.totalParticipations ?? 0;

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <Tabs defaultValue="users" className="w-full">
        <div className="flex items-center justify-between gap-4">
          <TabsList className="bg-white">
            <TabsTrigger value="users">کاربران</TabsTrigger>
            <TabsTrigger value="stats">آمار نظرسنجی</TabsTrigger>
          </TabsList>

          <Input
            placeholder="جستجو..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-72 bg-white"
          />
        </div>

        {/* ================= USERS ================= */}

        <TabsContent value="users" className="mt-4">
          <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16 text-center">آیدی</TableHead>

                  <TableHead>نام و نام خانوادگی</TableHead>

                  <TableHead>تلفن</TableHead>

                  <TableHead className="w-32 text-center">عملیات</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {data?.data?.map((game: GamificationResponse) => (
                  <TableRow key={game.id}>
                    <TableCell className="text-center font-medium">
                      {game.id}
                    </TableCell>

                    <TableCell>{game.fullName}</TableCell>

                    <TableCell>{game.phone}</TableCell>

                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                          >
                            <MoreHorizontalIcon className="size-4" />

                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleInfo(game)}>
                            جزئیات
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}

                {!data?.data?.length && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-32 text-center text-muted-foreground"
                    >
                      موردی پیدا نشد
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>

              <TableFooter>
                <TableRow>
                  <TableCell colSpan={4}>
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
        </TabsContent>

        {/* ================= STATS ================= */}

        <TabsContent value="stats" className="mt-4 space-y-6">
          {/* SUMMARY */}

          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  تعداد شرکت‌کنندگان
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="text-3xl font-bold">{totalParticipants}</div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  تعداد پاسخ‌ها
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="text-3xl font-bold">
                  {stats?.data?.totalAnswers ?? 0}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  تعداد سوالات
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="text-3xl font-bold">
                  {stats?.data?.totalQuestions ?? 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CHART */}

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>آمار انتخاب گزینه‌ها</CardTitle>
            </CardHeader>

            <CardContent>
              <ChartContainer
                config={chartConfig}
                className="min-h-[400px] w-full"
              >
                <BarChart
                  accessibilityLayer
                  data={chartData}
                  margin={{
                    top: 20,
                    right: 20,
                    left: 20,
                    bottom: 20,
                  }}
                >
                  <CartesianGrid vertical={false} />

                  <XAxis dataKey="question" tickLine={false} axisLine={false} />

                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent />}
                  />

                  <Bar
                    dataKey="option1"
                    name="گزینه ۱"
                    radius={4}
                    fill="#43AA8B"
                  />

                  <Bar
                    dataKey="option2"
                    name="گزینه ۲"
                    radius={4}
                    fill="#254441"
                  />

                  <Bar
                    dataKey="option3"
                    name="گزینه ۳"
                    radius={4}
                    fill="#FF6F59"
                  />

                  <Bar
                    dataKey="option4"
                    name="گزینه ۴"
                    radius={4}
                    fill="#DB504A"
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* QUESTION DETAILS */}

          <div className="grid gap-4 lg:grid-cols-2">
            {stats?.data?.questions?.map(question => (
              <Card
                key={question.questionNumber}
                className="border-0 shadow-sm"
              >
                <CardHeader>
                  <CardTitle className="text-base">
                    سوال {question.questionNumber}
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    {question.options?.map(option => {
                      const percentage =
                        question.totalAnswers > 0
                          ? Math.round(
                              (option.count / question.totalAnswers) * 100,
                            )
                          : 0;

                      return (
                        <div key={option.optionNumber} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>گزینه {option.optionNumber}</span>

                            <span className="font-medium">
                              {option.count} نفر ({percentage}
                              %)
                            </span>
                          </div>

                          <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{
                                width: `${percentage}%`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* ================= DETAIL MODAL ================= */}

      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-right text-lg">
              جزئیات نظرسنجی
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 pt-2">
            {/* USER INFO */}

            <div className="grid grid-cols-2 gap-4 rounded-xl bg-muted/40 p-4">
              <div>
                <div className="mb-1 text-xs text-muted-foreground">
                  نام و نام خانوادگی
                </div>

                <div className="font-medium">
                  {selectedInfo?.fullName || '-'}
                </div>
              </div>

              <div>
                <div className="mb-1 text-xs text-muted-foreground">تلفن</div>

                <div className="font-medium">{selectedInfo?.phone || '-'}</div>
              </div>

              <div>
                <div className="mb-1 text-xs text-muted-foreground">
                  تاریخ تولد
                </div>

                <div className="font-medium">
                  {selectedInfo?.birthDate || '-'}
                </div>
              </div>

              <div>
                <div className="mb-1 text-xs text-muted-foreground">
                  تاریخ ثبت
                </div>

                <div className="font-medium">
                  {toPersianDate(selectedInfo?.createdAt || '')}
                </div>
              </div>
            </div>

            {/* ANSWERS */}

            <div className="space-y-3">
              <h3 className="text-sm font-semibold">پاسخ‌ها</h3>

              {[1, 2, 3, 4].map(questionNumber => {
                const answer = selectedInfo?.answers?.find(
                  item => item.questionNumber === questionNumber,
                );

                const question = QUESTIONS[questionNumber - 1];

                const option =
                  answer && question?.options?.[answer.optionNumber - 1];

                return (
                  <div
                    key={questionNumber}
                    className="flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="text-sm text-muted-foreground">
                      جواب سوال {questionNumber}
                    </div>

                    <div className="font-medium">{option || '-'}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
