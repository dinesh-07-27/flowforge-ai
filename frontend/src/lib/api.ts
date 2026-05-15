const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost/api/v1";

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "An error occurred" }));
    throw new Error(error.detail || "API request failed");
  }

  return response.json();
}

export const workflowsApi = {
  list: () => fetchApi("/workflows/"),
  create: (data: any) => fetchApi("/workflows/", { method: "POST", body: JSON.stringify(data) }),
};

export const executionsApi = {
  list: () => fetchApi("/executions/"),
  get: (id: string) => fetchApi(`/executions/${id}`),
};

export const dashboardApi = {
  stats: () => fetchApi("/dashboard/stats"),
};
