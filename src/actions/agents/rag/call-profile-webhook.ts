"use server";

import { prisma } from "@/lib/db";

export const callProfileWebhook = async ({
  userId,
  webhookUrl,
  metadataKey,
}: {
  userId: string;
  webhookUrl: string;
  metadataKey: string;
}) => {
  try {
    if (!webhookUrl || !metadataKey) {
      return { success: true, message: "Webhook não configurado" };
    }

    const profile = await prisma.profile.findUnique({
      where: { userId },
    });

    const services = await prisma.service.findMany({
      where: { userId },
    });

    const links = await prisma.link.findMany({
      where: { userId },
    });

    const collaborators = await prisma.collaborator.findMany({
      where: { userId },
      include: {
        services: true,
      },
    });

    const optionsResponse = await fetch(webhookUrl, {
      method: "OPTIONS",
    });

    if (!optionsResponse.ok) {
      return {
        success: true,
        message: "Webhook não aceita POST, ignorando envio.",
      };
    }

    function formatBusinessHours(businessHours: any[]): string {
      if (!Array.isArray(businessHours)) return "";

      const grouped: Record<string, { open: string; close: string }[]> = {};
      businessHours.forEach((item) => {
        if (!grouped[item.day]) grouped[item.day] = [];
        grouped[item.day].push({ open: item.openTime, close: item.closeTime });
      });

      return Object.entries(grouped)
        .map(([day, intervals]) => {
          return intervals
            .map(
              (interval) => `${day}: Das ${interval.open} às ${interval.close}`
            )
            .join("\n");
        })
        .join("\n");
    }

    const formattedContent = `
        # Perfil da Empresa
        Nome da Empresa: ${profile?.companyName || ""}
        Endereço: ${profile?.address || ""}
        Whatsapp: ${profile?.whatsapp || ""}
        Horário de Funcionamento:
        ${
          Array.isArray(profile?.businessHours)
            ? formatBusinessHours(profile.businessHours as any[])
            : typeof profile?.businessHours === "string"
            ? (() => {
                try {
                  const parsed = JSON.parse(profile.businessHours as string);
                  return Array.isArray(parsed)
                    ? formatBusinessHours(parsed)
                    : "";
                } catch {
                  return "";
                }
              })()
            : ""
        }
        Documento: ${profile?.documentNumber || ""}
        Localização: ${profile?.locationUrl || ""}

        # Serviços Oferecidos
        ${services
          .map(
            (service) => `
                ## ${service.name}
                Preço: R$${service.price || ""}
                Duração: ${service.durationMinutes || ""} minutos
                Dias Disponíveis: ${service.availableDays?.join(", ") || ""}
                Observações: ${service.notes || ""}
                `
          )
          .join("\n")}

        # Profissionais
        ${collaborators
          .map(
            (collaborator) => `
                ## ${collaborator.name}
                Profissão: ${collaborator.profession || ""}
                Telefone: ${collaborator.phone || ""}
                Descrição: ${collaborator.description || ""}
                Horário de Trabalho: ${collaborator.workingHours || ""}
                Serviços: ${
                  collaborator.services
                    .map((service) => service.name)
                    .join(", ") || ""
                }
                `
          )
          .join("\n")}

        # Links
        ${links
          .map(
            (link) => `
                ${link.title}: ${link.url}
            `
          )
          .join("\n")}
        `;

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ragFiles: formattedContent,
        metadataKey: metadataKey,
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro ao chamar webhook: ${response.statusText}`);
    }

    return { success: true };
  } catch (webhookError) {
    console.error("Erro ao chamar webhook com dados do perfil:", webhookError);
    return {
      success: false,
      error: "Falha ao enviar dados para treinamento RAG",
    };
  }
};
