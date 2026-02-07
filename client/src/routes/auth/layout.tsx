import { Outlet, useNavigate } from "react-router";
import { useAuth } from "../../state/useAuth";
import { useEffect } from "react";
import { Container } from "@mantine/core";

export default function AuthLayout() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, []);

  return (
    <Container size="xs" style={{ padding: "2rem" }}>
      <Outlet />
    </Container>
  );
}
