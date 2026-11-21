export const config = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") ?? "",
  apiKey: process.env.EXPO_PUBLIC_API_KEY ?? "",
};
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
export async function request(
  path: string,
  options: {
    body?: unknown;
    token?: string;
    login?: boolean;
    apiKey?: string;
    method?: "GET" | "POST";
  } = {},
): Promise<unknown> {
  if (!config.apiUrl)
    throw new Error("Set EXPO_PUBLIC_API_URL in .env before connecting.");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  const apiKey = options.apiKey ?? config.apiKey;
  try {
    const response = await fetch(`${config.apiUrl}${path}`, {
      method: options.method ?? "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
    });
    const data: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const error = data as {
        msg?: string;
        errorMessage?: string;
        message?: string;
        detail?: string;
      } | null;
      const message = [
        error?.msg,
        error?.errorMessage,
        error?.message,
        error?.detail,
      ].find((value) => typeof value === "string" && value.length > 0);
      throw new ApiError(
        message || `Request failed (${response.status}).`,
        response.status,
      );
    }
    return data;
  } catch (error) {
    if (controller.signal.aborted)
      throw new Error(
        "Request timed out. Check the ticket status before trying again.",
      );
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
