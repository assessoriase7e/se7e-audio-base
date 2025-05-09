import { Tabs, TabsContent } from "@/components/ui/tabs";

import { CalendarGrid } from "../calendar-grid";
import { AppointmentFullData, CalendarFullData } from "@/types/calendar";
import { MobileCalendarSelector } from "../mobile-calendar-selector";
import { CalendarActionsModal } from "../calendar-actions-modal";
import { DesktopCalendarTabs } from "./desktop-calendar-tabs";
import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-is-mobile";
import IsTableLoading from "../../isTableLoading";

interface CalendarTabsProps {
  calendars: CalendarFullData[];
  calendarId: string;
  setCalendarId: (id: string) => void;
  hoveredTab: string | null;
  setHoveredTab: (tab: string | null) => void;
  openEditModal: (calendar: CalendarFullData) => void;
  openDeleteModal: (calendar: CalendarFullData) => void;
  currentDate: Date;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  goToToday: () => void;
  selectedDate: Date | null;
  openDayDetails: (date: Date) => void;
  appointments: Record<string, AppointmentFullData[]>;
}

export function CalendarTabs({
  calendars,
  calendarId,
  setCalendarId,
  hoveredTab,
  setHoveredTab,
  openEditModal,
  openDeleteModal,
  currentDate,
  goToPreviousMonth,
  goToNextMonth,
  goToToday,
  selectedDate,
  appointments,
}: CalendarTabsProps) {
  const [showActionsModal, setShowActionsModal] = useState<boolean>(false);
  const [selectedCalendar, setSelectedCalendar] =
    useState<CalendarFullData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const isMobile = useIsMobile();

  const handleChangeCalendar = async (id: string) => {
    setLoading(true);
    setCalendarId(id);
  };

  useEffect(() => {
    setLoading(false);
  }, [calendarId]);

  return (
    <div className="flex-1 overflow-hidden">
      {isMobile && (
        <MobileCalendarSelector
          calendars={calendars}
          calendarId={calendarId}
          setCalendarId={handleChangeCalendar}
          setCalendarIdQueryParam={handleChangeCalendar}
          onLongPress={(calendar) => {
            setSelectedCalendar(calendar);
            setShowActionsModal(true);
          }}
        />
      )}

      <Tabs
        value={calendarId}
        onValueChange={handleChangeCalendar}
        className="h-full flex flex-col gap-2 relative"
      >
        {!isMobile && (
          <DesktopCalendarTabs
            calendars={calendars}
            calendarId={calendarId}
            hoveredTab={hoveredTab}
            setHoveredTab={setHoveredTab}
            setCalendarIdQueryParam={handleChangeCalendar}
            openEditModal={openEditModal}
            openDeleteModal={openDeleteModal}
          />
        )}

        <IsTableLoading isPageChanging={loading} />

        {calendars.map((calendar) => (
          <TabsContent
            key={calendar.id}
            value={calendar.id}
            className="flex-1 mt-0 h-full"
          >
            <CalendarGrid
              currentDate={currentDate}
              goToPreviousMonth={goToPreviousMonth}
              goToNextMonth={goToNextMonth}
              goToToday={goToToday}
              selectedDate={selectedDate}
              appointments={appointments}
              calendarId={calendar.id}
            />
          </TabsContent>
        ))}
      </Tabs>

      <CalendarActionsModal
        open={showActionsModal}
        onOpenChange={setShowActionsModal}
        calendar={selectedCalendar}
        onEdit={openEditModal}
        onDelete={openDeleteModal}
      />
    </div>
  );
}
