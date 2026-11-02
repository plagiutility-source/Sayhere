/**
 * O4 — display-only per-spot scan counter.
 *
 * Opening an active spot page adds one to that spot's `scans`, at most once
 * per device every 30 minutes. It never touches the location total and is
 * never counted against a plan limit. The throttle lives in sessionStorage
 * (the same per-tab scope as the device id), not in localStorage.
 */
const SCAN_WINDOW_MS = 30 * 60 * 1000;
const SCAN_KEY = "syehere.mock.rooms.scan";

type Marks = Record<string, number>;

let memory: Marks = {};

function readMarks(): Marks {
  try {
    return JSON.parse(window.sessionStorage.getItem(SCAN_KEY) || "{}") as Marks;
  } catch {
    return memory;
  }
}

function writeMarks(marks: Marks): void {
  memory = marks;
  try {
    window.sessionStorage.setItem(SCAN_KEY, JSON.stringify(marks));
  } catch {
    /* The in-memory copy still throttles this tab. */
  }
}

/** True when this device may count a scan for the spot now. */
export function claimSpotScan(
  deviceId: string,
  locId: string,
  code: string,
  now: number = Date.now(),
): boolean {
  if (!deviceId || !locId || !code) return false;
  const key = `${deviceId}:${locId}:${code}`;
  const marks = readMarks();
  if (now - (marks[key] || 0) < SCAN_WINDOW_MS) return false;
  marks[key] = now;
  writeMarks(marks);
  return true;
}
