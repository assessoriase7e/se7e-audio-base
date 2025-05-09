"use server";

import { prisma } from "@/lib/db";
import { getClerkUser } from "../auth/getClerkUser";
import { revalidatePath } from "next/cache";

interface UpdateCollaboratorParams {
  id: string;
  name: string;
  workingHours: string;
  phone: string;
  profession: string;
  description?: string;
}

export async function updateCollaborator(params: UpdateCollaboratorParams) {
  try {
    const user = await getClerkUser();

    if (!user) {
      return {
        success: false,
        error: "Usuário não autenticado",
      };
    }

    const { id, name, workingHours, phone, profession, description } = params;

    const existingCollaborator = await prisma.collaborator.findUnique({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingCollaborator) {
      return {
        success: false,
        error: "Profissional não encontrado",
      };
    }

    const collaborator = await prisma.collaborator.update({
      where: {
        id,
      },
      data: {
        name,
        workingHours,
        phone,
        profession,
        description,
      },
    });

    revalidatePath("/collaborators");

    return {
      success: true,
      data: collaborator,
    };
  } catch (error) {
    console.error("[UPDATE_COLLABORATOR_ERROR]", error);
    return {
      success: false,
      error: "Ocorreu um erro ao atualizar o profissional",
    };
  }
}
