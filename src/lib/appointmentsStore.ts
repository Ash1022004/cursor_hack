import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export type AppointmentRecord = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department: string;
  preferredDate: string;
  notes?: string;
  createdAt: string;
};

function getFilePath(): string {
  const override = process.env.APPOINTMENTS_FILE;
  if (override) return path.resolve(override);
  return path.join(process.cwd(), "data", "appointments.json");
}

async function ensureFile(): Promise<void> {
  const file = getFilePath();
  await mkdir(path.dirname(file), { recursive: true });
  try {
    await readFile(file, "utf-8");
  } catch {
    await writeFile(file, "[]", "utf-8");
  }
}

export async function listAppointments(): Promise<AppointmentRecord[]> {
  await ensureFile();
  const raw = await readFile(getFilePath(), "utf-8");
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as AppointmentRecord[];
  } catch {
    return [];
  }
}

export async function addAppointment(
  input: Omit<AppointmentRecord, "id" | "createdAt">
): Promise<AppointmentRecord> {
  await ensureFile();
  const file = getFilePath();
  const list = await listAppointments();
  const record: AppointmentRecord = {
    ...input,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
  };
  list.push(record);
  await writeFile(file, JSON.stringify(list, null, 2), "utf-8");
  return record;
}
