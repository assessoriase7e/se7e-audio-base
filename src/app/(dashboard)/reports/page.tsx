import { Suspense } from "react";
import { LoaderCircle } from "lucide-react";
import moment from "moment";
import { getDashboardData } from "@/actions/reports/getDashboardData";
import { getTopClientsByServices } from "@/actions/reports/getTopClients";
import { getTopClientsBySpending } from "@/actions/reports/getTopClientsBySpending";
import { getCollaborators } from "@/actions/reports/getCollaborators";
import { getCollaboratorCommission } from "@/actions/reports/getCollaboratorCommission";
import { DashboardCards } from "@/components/reports/dashboard-cards";
import { CollaboratorCommission } from "@/components/reports/collaborator-commission";
import { getRevenueByPeriod } from "@/actions/reports/getRevenueByPeriod";
import { TopClients } from "@/components/reports/top-clients";
import { RevenueChart } from "@/components/reports/revenue-chart";
import { revenueChartConfig } from "@/constants/chartConfig";
import { MonthlyRevenueChart } from "@/components/reports/monthly-revenue-chart";
import { monthlyRevenueChartConfig } from "@/constants/chartConfig";
import { CanceledAppointments } from "@/components/reports/canceled-appointments";
import { ScheduledAppointments } from "@/components/reports/scheduled-appointments";
import { getCanceledAppointments } from "@/actions/reports/getCanceledAppointments";
import { getScheduledAppointments } from "@/actions/reports/getScheduledAppointments";
import { prisma } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";

type ReportsSearchParamsProps = {
  fromRevenue?: string;
  toRevenue?: string;
  fromMonthlyRevenue?: string;
  toMonthlyRevenue?: string;
  fromCollab?: string;
  toCollab?: string;
  collaboratorId?: string;
  fromCanceled?: string;
  toCanceled?: string;
  fromScheduled?: string;
  toScheduled?: string;
  [key: string]: string | string[] | undefined;
};

export default async function ReportsPage({ searchParams }: { searchParams: Promise<ReportsSearchParamsProps> }) {
  const user = await currentUser();
  const dashboardResult = await getDashboardData();
  const dashboardData = dashboardResult.success
    ? dashboardResult.data
    : {
        clientCount: 0,
        completedAppointmentsCount: 0,
        futureAppointmentsCount: 0,
        todayRevenue: 0,
      };

  const {
    fromRevenue,
    toRevenue,
    fromMonthlyRevenue,
    toMonthlyRevenue,
    fromCollab,
    toCollab,
    collaboratorId,
    fromCanceled,
    toCanceled,
    fromScheduled,
    toScheduled,
  } = await searchParams;

  const today = moment().endOf("day").toDate();
  const formatedFromRevenue = fromRevenue
    ? moment(fromRevenue as string)
        .startOf("day")
        .toDate()
    : moment().subtract(1, "M").startOf("day").toDate();
  const formatedToRevenue = toRevenue
    ? moment(toRevenue as string)
        .endOf("day")
        .toDate()
    : today;

  const formatedFromMonthlyRevenue = fromMonthlyRevenue
    ? moment(fromMonthlyRevenue as string).toDate()
    : moment().startOf("day").toDate();
  const formatedToMonthlyRevenue = toMonthlyRevenue
    ? moment(toMonthlyRevenue as string)
        .endOf("day")
        .toDate()
    : moment().add(1, "month").endOf("day").toDate();

  const revenueResult = await getRevenueByPeriod(formatedFromRevenue, formatedToRevenue);
  const revenueData = revenueResult.success ? revenueResult.data : [];

  const monthlyRevenueResult =
    fromMonthlyRevenue || toMonthlyRevenue
      ? await getRevenueByPeriod(formatedFromMonthlyRevenue, formatedToMonthlyRevenue)
      : revenueResult;

  const monthlyRevenueData = monthlyRevenueResult.success ? monthlyRevenueResult.monthlyData : [];

  const periodRevenue = revenueData.reduce((total, item) => total + item.revenue, 0);

  const formatedFromCollab = fromCollab
    ? moment(fromCollab as string)
        .startOf("day")
        .toDate()
    : moment().subtract(1, "M").startOf("day").toDate();
  const formatedToCollab = toCollab
    ? moment(toCollab as string)
        .endOf("day")
        .toDate()
    : today;

  const collaboratorsResult = await getCollaborators();
  const collaborators = collaboratorsResult.success ? collaboratorsResult.data : [];

  const commissionResult = await getCollaboratorCommission(
    Number(collaboratorId),
    formatedFromCollab,
    formatedToCollab
  );

  const commissionData = commissionResult.success ? commissionResult.data : [];

  const topClientsResult = await getTopClientsByServices(5);
  const topClients = topClientsResult.success ? topClientsResult.data : [];

  const topClientsBySpendingResult = await getTopClientsBySpending(5);
  const topClientsBySpending = topClientsBySpendingResult.success ? topClientsBySpendingResult.data : [];

  // Datas para agendamentos cancelados
  const formatedFromCanceled = fromCanceled
    ? moment(fromCanceled as string)
        .startOf("day")
        .toDate()
    : moment().subtract(1, "M").startOf("day").toDate();
  const formatedToCanceled = toCanceled
    ? moment(toCanceled as string)
        .endOf("day")
        .toDate()
    : today;

  // Datas para agendamentos agendados
  const formatedFromScheduled = fromScheduled
    ? moment(fromScheduled as string)
        .startOf("day")
        .toDate()
    : moment().startOf("day").toDate();
  const formatedToScheduled = toScheduled
    ? moment(toScheduled as string)
        .endOf("day")
        .toDate()
    : moment().add(1, "M").endOf("day").toDate();

  // Buscar dados de agendamentos cancelados e agendados
  const canceledAppointmentsResult = await getCanceledAppointments(formatedFromCanceled, formatedToCanceled);
  const canceledAppointments = canceledAppointmentsResult.success ? canceledAppointmentsResult.data : [];

  const scheduledAppointmentsResult = await getScheduledAppointments(formatedFromScheduled, formatedToScheduled);
  const scheduledAppointments = scheduledAppointmentsResult.success ? scheduledAppointmentsResult.data : [];

  // Buscar aniversariantes do mês atual
  const currentMonth = moment().month() + 1;
  const birthdayClientsResult = await prisma.client.findMany({
    where: {
      userId: user?.id,
    },
    select: {
      id: true,
      fullName: true,
      birthDate: true,
    },
  });

  const birthdayClients = birthdayClientsResult
    .filter((client) => {
      const birthMonth = moment(client.birthDate).month() + 1;
      return birthMonth === currentMonth;
    })
    .map((client) => ({
      id: client.id,
      fullName: client.fullName,
      birthDate: client.birthDate?.toISOString() || "",
    }));

  return (
    <div className="space-y-6 border border-border border-dashed p-5 rounded-lg bg-card">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
        <p className="text-muted-foreground">Visualize os dados e métricas do seu negócio.</p>
      </div>

      <Suspense fallback={<LoaderCircle className="animate-spin" />}>
        <DashboardCards
          clientCount={dashboardData.clientCount}
          completedAppointmentsCount={dashboardData.completedAppointmentsCount}
          futureAppointmentsCount={dashboardData.futureAppointmentsCount}
          todayRevenue={dashboardData.todayRevenue}
          periodRevenue={fromRevenue && toRevenue ? periodRevenue : undefined}
          canceledAppointmentsCount={canceledAppointments.length}
          birthdayClients={birthdayClients}
        />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="flex flex-col lg:flex-row gap-5 col-span-1 lg:col-span-4">
          <Suspense fallback={<LoaderCircle className="animate-spin" />}>
            <div className="grid grid-cols-1 gap-4 w-full">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 w-full">
                <Suspense fallback={<LoaderCircle className="animate-spin" />}>
                  <MonthlyRevenueChart
                    data={monthlyRevenueData}
                    config={monthlyRevenueChartConfig}
                    initialFromDate={formatedFromMonthlyRevenue}
                    initialToDate={formatedToMonthlyRevenue}
                  />
                </Suspense>

                <Suspense fallback={<LoaderCircle className="animate-spin" />}>
                  <RevenueChart
                    data={revenueData}
                    config={revenueChartConfig}
                    initialFromDate={formatedFromRevenue}
                    initialToDate={formatedToRevenue}
                  />
                </Suspense>
              </div>
            </div>
          </Suspense>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 w-full">
        <Suspense fallback={<LoaderCircle className="animate-spin" />}>
          <CollaboratorCommission
            collaborators={collaborators}
            commissionData={commissionData}
            selectedCollaborator={Number(collaboratorId)}
            dateRange={{
              from: formatedFromCollab,
              to: formatedToCollab,
            }}
          />
        </Suspense>

        <Suspense fallback={<LoaderCircle className="animate-spin" />}>
          <TopClients topClientsByServices={topClients} topClientsBySpending={topClientsBySpending} />
        </Suspense>
      </div>

      {/* Novos componentes de agendamentos */}
      <div className="grid grid-cols-1 gap-5 w-full">
        <Suspense fallback={<LoaderCircle className="animate-spin" />}>
          <ScheduledAppointments
            initialAppointments={scheduledAppointments}
            initialFromDate={formatedFromScheduled}
            initialToDate={formatedToScheduled}
          />
        </Suspense>

        <CanceledAppointments
          initialAppointments={canceledAppointments}
          initialFromDate={formatedFromCanceled}
          initialToDate={formatedToCanceled}
        />
      </div>
    </div>
  );
}
