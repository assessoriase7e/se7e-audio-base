"use server";
import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import moment from "moment";

type DailyRevenue = {
  date: string;
  revenue: number;
};

type MonthlyRevenue = {
  month: string;
  revenue: number;
};

type RevenueResult =
  | { success: true; data: DailyRevenue[]; monthlyData: MonthlyRevenue[] }
  | { success: false; error: string };

async function fetchRevenueByPeriod(
  userId: string,
  from: Date,
  to: Date
): Promise<RevenueResult> {
  try {
    const appointments = await prisma.appointment.findMany({
      where: {
        userId: userId,
        endTime: {
          gte: from,
          lte: to,
        },
        status: "scheduled",
      },
      include: {
        service: {
          select: {
            price: true,
          },
        },
      },
    });

    const revenueMap: Record<string, number> = {};
    const monthlyRevenueMap: Record<string, number> = {};

    for (const appointment of appointments) {
      const dateStr = appointment.endTime.toISOString().split("T")[0];
      const monthStr = moment(appointment.endTime).format("YYYY-MM");
      // Usar finalPrice em vez do preço do serviço
      const price =
        appointment.finalPrice ||
        appointment.servicePrice ||
        appointment.service?.price ||
        0;

      revenueMap[dateStr] = (revenueMap[dateStr] || 0) + price;

      monthlyRevenueMap[monthStr] = (monthlyRevenueMap[monthStr] || 0) + price;
    }

    const revenueData: DailyRevenue[] = Object.entries(revenueMap)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const monthlyData: MonthlyRevenue[] = Object.entries(monthlyRevenueMap)
      .map(([month, revenue]) => ({
        month: moment(month).format("MMM/YYYY"),
        revenue,
      }))
      .sort((a, b) =>
        moment(a.month, "MMM/YYYY").diff(moment(b.month, "MMM/YYYY"))
      );

    return { success: true, data: revenueData, monthlyData };
  } catch (error) {
    console.error("Erro ao buscar faturamento por período:", error);
    return { success: false, error: "Erro interno ao buscar faturamento." };
  }
}

export const getRevenueByPeriod = async (
  from: Date,
  to: Date
): Promise<RevenueResult> => {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Usuário não autenticado." };
  }

  return fetchRevenueByPeriod(userId, from, to);
};
