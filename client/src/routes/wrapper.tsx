import { Outlet } from "react-router";
import { AuthStatusProvider } from "../state/AuthContext";

export default function Wrapper() {
  return (
    <AuthStatusProvider>
      <Outlet />
    </AuthStatusProvider>
  );
}
