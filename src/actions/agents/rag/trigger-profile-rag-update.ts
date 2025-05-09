"use server";

import { prisma } from "@/lib/db";
import { callProfileWebhook } from "./call-profile-webhook";
import { ragConfig } from "@/config/rag";

export const triggerProfileRagUpdate = async (userId: string) => {
  try {
    if (!process.env.RAG_WEBHOOK_URL) {
      return { success: true, message: "Webhook não configurado" };
    }

    try {
      const response = await fetch(process.env.RAG_WEBHOOK_URL, {
        method: "OPTIONS",
      });

      if (!response.ok) {
        return {
          success: true,
          message: "Webhook indisponível, fluxo ignorado",
        };
      }
    } catch (error) {
      return {
        success: true,
        message: "Erro de conexão com webhook, fluxo ignorado",
      };
    }

    const profile = await prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile || !profile.companyName) {
      return {
        success: false,
        error: "Perfil ou nome da empresa não encontrado",
      };
    }

    const metadataKey = profile.companyName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");

    return await callProfileWebhook({
      userId,
      webhookUrl: ragConfig.webhookUrl,
      metadataKey: `${profile.whatsapp}_${metadataKey}`,
    });
  } catch (error) {
    console.error("Erro ao acionar atualização RAG do perfil:", error);
    return { success: false, error: "Falha ao acionar atualização RAG" };
  }
};
