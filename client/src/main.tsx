import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, data } from "react-router";
import { RouterProvider } from "react-router/dom";

import "@mantine/core/styles.css";

import AuthLayout from "./routes/auth/layout.tsx";
import Login from "./routes/auth/login.tsx";
import Register from "./routes/auth/register.tsx";
import DefaultLayout from "./routes/layout.tsx";
import Dashboard, {
  ErrorBoundary as DashboardErrorBoundary,
} from "./routes/dashboard.tsx";
import { MantineProvider } from "@mantine/core";
import VerifyEmail from "./routes/auth/verify-email.tsx";
import { fetchWithAuth } from "./utils/api.ts";
import Wrapper from "./routes/wrapper.tsx";

const router = createBrowserRouter([
  {
    Component: Wrapper,
    children: [
      {
        Component: DefaultLayout,
        children: [
          {
            path: "/",
            Component: Dashboard,
            loader: async ({ request }) => {
              const searchParams = new URL(request.url).searchParams;
              const response = await fetchWithAuth(
                `${import.meta.env.VITE_BACKEND_URL}?` + searchParams,
                {
                  credentials: "include",
                },
              );
              if (!response.ok) {
                throw new Error("Failed to load dashboard");
              }
              const user = await response.json();
              return user;
            },
            ErrorBoundary: DashboardErrorBoundary,
          },
          {
            path: "/verify-email",
            Component: VerifyEmail,
            loader: async ({ request }) => {
              const searchParams = new URL(request.url).searchParams;
              // const token = searchParams.get("token");
              // if (!token)
              //   return {
              //     state: "submitted",
              //   };

              // const response = await fetch(
              //   `${import.meta.env.VITE_BACKEND_URL}/auth/verify-email?` +
              //     new URL(request.url).searchParams,
              //   {
              //     credentials: "include",
              //   },
              // );
              // if (!response.ok) {
              //   return {
              //     state: "error",
              //     message: "Failed to verify email",
              //   };
              // }
              // return {
              //   state: "success",
              //   message: "Email verified successfully",
              // };
              const verify = searchParams.get("verify");
              if (!!verify && verify === "true") {
                const response = await fetch(
                  `${import.meta.env.VITE_BACKEND_URL}/auth/verify-email`,
                  {
                    credentials: "include",
                  },
                );
                if (!response.ok) {
                  return {
                    state: "error",
                    message: "Failed to verify email",
                  };
                }
                return {
                  state: "success",
                  message: "Email verified successfully",
                };
              } else
                return {
                  state: "submitted",
                };
            },
          },
        ],
      },
      {
        Component: AuthLayout,
        children: [
          {
            path: "login",
            Component: Login,
            action: async ({ request }) => {
              const formData = await request.formData();
              const email = formData.get("email");
              const password = formData.get("password");
              try {
                const response = await fetch(
                  `${import.meta.env.VITE_BACKEND_URL}/auth/login`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({ email, password }),
                  },
                );
                if (!response.ok) {
                  const errorData = await response.json();
                  return data(
                    { error: errorData.message },
                    { status: response.status },
                  );
                }
                return await response.json();
              } catch (error) {
                console.log(error);
              }
            },
          },
          {
            path: "register",
            Component: Register,
            action: async ({ request }) => {
              const formData = await request.formData();
              const email = formData.get("email");
              const name = formData.get("name");
              const password = formData.get("password");
              try {
                const response = await fetch(
                  `${import.meta.env.VITE_BACKEND_URL}/auth/register`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({ email, name, password }),
                  },
                );
                if (response.ok) {
                  return await response.json();
                } else {
                  const errorData = await response.json();
                  return data({ error: errorData.message }, { status: 400 });
                }
              } catch (error) {
                console.log(error);
              }
            },
          },
        ],
      },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider>
      <RouterProvider router={router} />
    </MantineProvider>
  </StrictMode>,
);
