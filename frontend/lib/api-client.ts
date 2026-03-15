export type ApiErrorPayload = {
  code?: string;
  message?: string;
};

export class ApiError extends Error {
  code?: string;
  status: number;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export type CurrentUser = {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  const contentType = response.headers.get("content-type");
  const isJson = contentType?.includes("application/json") ?? false;

  if (!response.ok) {
    let payload: ApiErrorPayload | undefined;
    if (isJson) {
      payload = (await response.json()) as ApiErrorPayload;
    }
    throw new ApiError(
      payload?.message ?? `API request failed with status ${response.status}`,
      response.status,
      payload?.code,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  if (!isJson) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function register(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}) {
  return request<{ userId: number; message: string }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function checkEmailAvailability(email: string) {
  const params = new URLSearchParams({ email });
  return request<{ available: boolean }>(
    `/api/auth/email-availability?${params.toString()}`,
  );
}

export async function login(input: { email: string; password: string }) {
  return request<{ userId: number; message: string }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function loginWithGoogle(input: {
  idToken: string;
  rememberMe: boolean;
  firstName?: string;
  lastName?: string;
}) {
  return request<{ userId: number; message: string }>("/api/auth/google", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function logout() {
  return request<void>("/api/auth/logout", {
    method: "POST",
  });
}

export async function getCurrentUser() {
  return request<CurrentUser>("/api/auth/me");
}

