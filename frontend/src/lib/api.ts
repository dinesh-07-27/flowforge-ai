// Using a relative path so it always works through the Nginx proxy
const API_BASE_URL = "/api/v1";

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  // Get token from localStorage if it exists
  const token = typeof window !== 'undefined' ? localStorage.getItem("auth_token") : null;
  
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && typeof window !== 'undefined') {
    // If unauthorized, clear token and redirect to login
    localStorage.removeItem("auth_token");
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "An error occurred" }));
    throw new Error(error.detail || "API request failed");
  }

  return response.json();
}

export const workflowsApi = {
  list: () => fetchApi("/workflows/"),
  get: (id: string | number) => fetchApi(`/workflows/${id}`),
  create: (data: any) => fetchApi("/workflows/", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string | number, data: any) => fetchApi(`/workflows/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: string | number) => fetchApi(`/workflows/${id}`, { method: "DELETE" }),
  run: (id: string | number) => fetchApi(`/workflows/${id}/run`, { method: "POST" }),
};

export const executionsApi = {
  list: () => fetchApi("/executions/"),
  get: (id: string) => fetchApi(`/executions/${id}`),
};

export const dashboardApi = {
  stats: () => fetchApi("/dashboard/stats"),
};

export const authApi = {
  login: async (formData: FormData) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      body: formData, // OAuth2PasswordRequestForm expects form data
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Login failed" }));
      throw new Error(error.detail || "Login failed");
    }
    
    const data = await response.json();
    if (typeof window !== 'undefined') {
      localStorage.setItem("auth_token", data.access_token);
    }
    return data;
  },
  register: async (email: string, pass: string) => {
    return fetchApi("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password: pass }),
    });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem("auth_token");
      window.location.href = "/login";
    }
  }
};
