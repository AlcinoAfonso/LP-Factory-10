import "server-only";

export function isE1011PassageEnabled(): boolean {
  return process.env.E10_11_PASSAGE_ENABLED === "true";
}

export function isE1012AttendanceEnabled(): boolean {
  return process.env.E10_12_ATTENDANCE_ENABLED === "true";
}
