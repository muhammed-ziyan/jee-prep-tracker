import { useRef, useEffect, useState } from "react";
import { isToday, isPast } from "date-fns";
import { useRevisionSchedule } from "@/hooks/use-revision";
import { useToast } from "@/hooks/use-toast";

type ScheduleItem = { id: number; scheduledDate: string; status: string; topic?: { name: string } };

function getDueTodayAndOverdue(schedule: ScheduleItem[] | undefined) {
  if (!schedule?.length) return { dueToday: [], overdue: [] };
  const dueToday: ScheduleItem[] = [];
  const overdue: ScheduleItem[] = [];
  for (const item of schedule) {
    if (item.status === "completed") continue;
    const date = new Date(item.scheduledDate);
    if (isToday(date)) dueToday.push(item);
    else if (isPast(date)) overdue.push(item);
  }
  return { dueToday, overdue };
}

/** Show in-app toasts and optional browser notification when user has revisions due today or overdue. */
export function useRevisionNotifications() {
  const { data: schedule } = useRevisionSchedule();
  const { toast } = useToast();
  const hasNotifiedRef = useRef(false);
  const hasBrowserNotifiedRef = useRef(false);

  useEffect(() => {
    if (!schedule?.length) return;

    const { dueToday, overdue } = getDueTodayAndOverdue(schedule);
    const dueCount = dueToday.length;
    const overdueCount = overdue.length;
    if (dueCount === 0 && overdueCount === 0) return;

    // In-app toast: once per session
    if (!hasNotifiedRef.current) {
      hasNotifiedRef.current = true;
      const parts: string[] = [];
      if (overdueCount > 0) parts.push(`${overdueCount} overdue`);
      if (dueCount > 0) parts.push(`${dueCount} due today`);
      const message = parts.join(", ");
      toast({
        title: "Revisions need your attention",
        description: `You have ${message} revision${dueCount + overdueCount > 1 ? "s" : ""}.`,
        variant: overdueCount > 0 ? "destructive" : "warning",
      });
    }

    // Browser notification: once per session, only if permission granted
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted" && !hasBrowserNotifiedRef.current) {
      hasBrowserNotifiedRef.current = true;
      const total = dueCount + overdueCount;
      const title = total === 1 ? "1 revision due" : `${total} revisions due`;
      const body = overdueCount > 0
        ? `${overdueCount} overdue, ${dueCount} due today`
        : `${dueCount} due today`;
      try {
        new Notification(title, { body });
      } catch {
        // ignore
      }
    }
  }, [schedule, toast]);
}

/** Request browser notification permission for revision reminders. */
export function useRevisionNotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission>(() =>
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "denied"
  );

  const requestPermission = async (): Promise<NotificationPermission> => {
    if (typeof window === "undefined" || !("Notification" in window)) return "denied";
    if (Notification.permission === "granted") {
      setPermission("granted");
      return "granted";
    }
    if (Notification.permission === "denied") return "denied";
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  };

  return { permission, requestPermission };
}
