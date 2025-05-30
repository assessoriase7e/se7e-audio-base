"use server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { revalidatePath } from "next/cache";

export async function createCalendar({
  name,
  collaboratorId,
  accessCode,
}: {
  name: string;
  collaboratorId?: number;
  accessCode?: string | null;
}) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: "Não autorizado",
      };
    }

    const calendar = await prisma.calendar.create({
      data: {
        name,
        userId,
        collaboratorId,
        accessCode,
      },
    });

    revalidatePath("/calendar");

    return {
      success: true,
      data: calendar,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Dados inválidos",
        fieldErrors: error.flatten().fieldErrors,
      };
    }

    console.error("[CALENDAR_CREATE]", error);
    return {
      success: false,
      error: "Falha ao criar calendário",
    };
  }
}
