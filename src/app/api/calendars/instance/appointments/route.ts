import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateApiKey } from "@/lib/api-key-utils";
import moment from "moment";

export async function GET(req: NextRequest) {
  try {
    const apiKeyHeader = req.headers.get("Authorization");
    const validationResult = await validateApiKey(apiKeyHeader);

    if (!validationResult.isValid) {
      return new NextResponse("Não autorizado", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const instance = searchParams.get("instance");
    const date = searchParams.get("date");
    const calendarId = searchParams.get("calendarId");

    if (!instance) {
      return NextResponse.json(
        { error: "Instância não fornecida" },
        { status: 400 }
      );
    }

    if (!date) {
      return NextResponse.json(
        { error: "Data não fornecida" },
        { status: 400 }
      );
    }

    const evolutionInstance = await prisma.evolutionInstance.findFirst({
      where: { name: instance },
      include: { user: true },
    });

    if (!evolutionInstance) {
      return NextResponse.json(
        { error: "Instância não encontrada" },
        { status: 404 }
      );
    }

    const startDate = moment(date).startOf("day").toDate();
    const endDate = moment(date).endOf("day").toDate();

    const appointments = await prisma.appointment.findMany({
      where: {
        userId: evolutionInstance.userId,
        startTime: {
          gte: startDate,
          lte: endDate,
        },
        ...(calendarId ? { calendarId } : {}),
      },
      include: {
        client: true,
        service: true,
        calendar: true,
        collaborator: true,
      },
      orderBy: {
        startTime: "asc",
      },
    });

    // Formatar os agendamentos para leitura por IA
    const formattedDate = moment(date).format('DD/MM/YYYY');
    const formattedResponse = formatCalendarAppointmentsForAI(appointments, formattedDate, calendarId);
    
    return NextResponse.json({ data: appointments, formatted: formattedResponse });
  } catch (error) {
    console.error("Erro ao buscar agendamentos:", error);
    return NextResponse.json(
      { error: "Erro ao buscar agendamentos" },
      { status: 500 }
    );
  }
}

// Função para formatar agendamentos de calendário para leitura por IA
function formatCalendarAppointmentsForAI(appointments: any[], date: string, calendarId?: string) {
  if (!appointments || appointments.length === 0) {
    return `Não há agendamentos para o dia ${date}${calendarId ? ' neste calendário específico' : ''}.`;
  }

  let calendarName = '';
  if (appointments.length > 0 && appointments[0].calendar) {
    calendarName = appointments[0].calendar.name || 'Sem nome';
  }

  let formattedText = `Encontrei ${appointments.length} agendamentos para o dia ${date}`;
  if (calendarId && calendarName) {
    formattedText += ` no calendário ${calendarName}`;
  }
  formattedText += ":\n\n";

  appointments.forEach((appointment, index) => {
    const startTime = new Date(appointment.startTime);
    
    formattedText += `${index + 1}. Horário: ${startTime.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}\n`;
    
    if (appointment.client) {
      formattedText += `   Cliente: ${appointment.client.fullName}\n`;
      formattedText += `   Telefone: ${appointment.client.phone}\n`;
    } else {
      formattedText += "   Cliente: Não informado\n";
    }
    
    if (appointment.service) {
      formattedText += `   Serviço: ${appointment.service.name}\n`;
    }
    
    if (appointment.collaborator) {
      formattedText += `   Profissional: ${appointment.collaborator.name}\n`;
    }
    
    if (appointment.notes) {
      formattedText += `   Observações: ${appointment.notes}\n`;
    }
    
    formattedText += "\n";
  });

  return formattedText;
}
