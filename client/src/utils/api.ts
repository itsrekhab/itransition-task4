let logoutFn: (() => void) | null = null;

export function setLogoutFn(fn: () => void) {
  logoutFn = fn;
}

export const fetchWithAuth = async (
  url: string,
  options: RequestInit = {},
): Promise<Response> => {
  options.credentials = "include";

  let response = await fetch(url, options);

  if (
    (response.status === 401 || response.status === 403) &&
    !url.includes("/auth/refresh")
  ) {
    const refreshResponse = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/auth/refresh`,
      {
        method: "POST",
        credentials: "include",
      },
    );

    if (refreshResponse.ok) {
      response = await fetch(url, options);
    } else {
      if (logoutFn) {
        logoutFn();
      }
      throw new Response("Unauthorized: Refresh token expired or invalid", {
        status: 401,
      });
    }
  }

  return response;
};
