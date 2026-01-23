/**
 * Local notification service for TODO reminders AND collaborator activity.
 *
 * CONTEXT.md requirements:
 * - Push notifications: Both collaborator activity AND TODO due date reminders
 *
 * Implementation note: Uses Capacitor LocalNotifications for BOTH use cases.
 * - TODO reminders: Scheduled notifications at due date
 * - Collaborator activity: Immediate local notifications triggered by WebSocket awareness events
 *
 * This approach avoids needing push infrastructure (FCM, APNs) for MVP.
 * The WebSocket connection already delivers real-time awareness updates;
 * we simply show a local notification when those events fire.
 */
import { LocalNotifications } from '@capacitor/local-notifications';
import { isNativePlatform } from './platform';

// Map TODO IDs to notification IDs (numeric required by Capacitor)
const notificationIdMap = new Map<string, number>();
let nextNotificationId = 1;

// Collaborator notification IDs start at 100000 to avoid collision
let nextCollaboratorNotificationId = 100000;

/**
 * Get or create a numeric notification ID for a TODO.
 */
function getNotificationId(todoId: string): number {
  if (notificationIdMap.has(todoId)) {
    return notificationIdMap.get(todoId)!;
  }
  const id = nextNotificationId++;
  notificationIdMap.set(todoId, id);
  return id;
}

/**
 * Schedule a reminder notification for a TODO.
 *
 * @param todoId - Unique TODO identifier
 * @param title - TODO title to display in notification
 * @param dueDate - When to trigger the notification
 * @param reminderBefore - Minutes before due date to remind (default: 30)
 */
export async function scheduleTodoReminder(
  todoId: string,
  title: string,
  dueDate: Date,
  reminderBefore: number = 30
): Promise<boolean> {
  if (!isNativePlatform()) return false;

  try {
    // Request permission first
    const permission = await LocalNotifications.requestPermissions();
    if (permission.display !== 'granted') {
      console.warn('[Notifications] Permission not granted');
      return false;
    }

    // Calculate reminder time
    const reminderTime = new Date(dueDate.getTime() - reminderBefore * 60 * 1000);

    // Don't schedule if already past
    if (reminderTime <= new Date()) {
      console.log('[Notifications] Reminder time already passed');
      return false;
    }

    const notificationId = getNotificationId(todoId);

    // Cancel existing notification for this TODO
    await LocalNotifications.cancel({ notifications: [{ id: notificationId }] });

    // Schedule new notification
    await LocalNotifications.schedule({
      notifications: [{
        id: notificationId,
        title: 'TODO Reminder',
        body: title,
        schedule: { at: reminderTime },
        extra: { todoId },
        smallIcon: 'ic_stat_notification',
        iconColor: '#14b8a6',  // Teal brand color
      }],
    });

    console.log(`[Notifications] Scheduled reminder for "${title}" at ${reminderTime}`);
    return true;
  } catch (error) {
    console.error('[Notifications] Failed to schedule reminder:', error);
    return false;
  }
}

/**
 * Cancel a scheduled reminder for a TODO.
 */
export async function cancelTodoReminder(todoId: string): Promise<void> {
  if (!isNativePlatform()) return;

  const notificationId = notificationIdMap.get(todoId);
  if (notificationId) {
    await LocalNotifications.cancel({ notifications: [{ id: notificationId }] });
    notificationIdMap.delete(todoId);
    console.log(`[Notifications] Cancelled reminder for TODO ${todoId}`);
  }
}

/**
 * Show immediate local notification when collaborator joins the board.
 *
 * Called from Canvas.tsx when awareness 'update' event detects a new user.
 *
 * @param userName - Name of the collaborator who joined
 * @param boardName - Name of the board (optional)
 */
export async function notifyCollaboratorJoined(
  userName: string,
  boardName?: string
): Promise<void> {
  if (!isNativePlatform()) return;

  try {
    const permission = await LocalNotifications.checkPermissions();
    if (permission.display !== 'granted') return;

    const id = nextCollaboratorNotificationId++;
    const body = boardName
      ? `${userName} joined "${boardName}"`
      : `${userName} joined the board`;

    await LocalNotifications.schedule({
      notifications: [{
        id,
        title: 'Collaborator Joined',
        body,
        smallIcon: 'ic_stat_notification',
        iconColor: '#14b8a6',
      }],
    });

    console.log(`[Notifications] Collaborator joined: ${userName}`);
  } catch (error) {
    console.error('[Notifications] Failed to notify collaborator join:', error);
  }
}

/**
 * Show immediate local notification when collaborator leaves the board.
 *
 * Called from Canvas.tsx when awareness 'update' event detects user departure.
 *
 * @param userName - Name of the collaborator who left
 * @param boardName - Name of the board (optional)
 */
export async function notifyCollaboratorLeft(
  userName: string,
  boardName?: string
): Promise<void> {
  if (!isNativePlatform()) return;

  try {
    const permission = await LocalNotifications.checkPermissions();
    if (permission.display !== 'granted') return;

    const id = nextCollaboratorNotificationId++;
    const body = boardName
      ? `${userName} left "${boardName}"`
      : `${userName} left the board`;

    await LocalNotifications.schedule({
      notifications: [{
        id,
        title: 'Collaborator Left',
        body,
        smallIcon: 'ic_stat_notification',
        iconColor: '#14b8a6',
      }],
    });

    console.log(`[Notifications] Collaborator left: ${userName}`);
  } catch (error) {
    console.error('[Notifications] Failed to notify collaborator leave:', error);
  }
}

/**
 * Check notification permission status.
 * Normalizes Capacitor's 'prompt-with-rationale' to 'prompt'.
 */
export async function checkNotificationPermission(): Promise<'granted' | 'denied' | 'prompt'> {
  if (!isNativePlatform()) return 'denied';

  try {
    const result = await LocalNotifications.checkPermissions();
    const status = result.display;
    if (status === 'granted' || status === 'denied' || status === 'prompt') {
      return status;
    }
    // 'prompt-with-rationale' or other states map to 'prompt'
    return 'prompt';
  } catch {
    return 'prompt';
  }
}

/**
 * Request notification permission.
 * Call this early in app lifecycle (e.g., on first board view).
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNativePlatform()) return false;

  try {
    const result = await LocalNotifications.requestPermissions();
    return result.display === 'granted';
  } catch {
    return false;
  }
}
