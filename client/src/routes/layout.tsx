import { AppShell, Button, Container, Flex } from "@mantine/core";
import { Outlet } from "react-router";
import { Link } from "react-router";
import { useAuth } from "../state/useAuth";

export default function DefaultLayout() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <AppShell header={{ height: 60, offset: true }} padding="md">
      <AppShell.Header
        bg="gray.2"
        style={{
          padding: "1rem",
        }}
        withBorder={false}
      >
        <Flex h={"100%"} justify="space-between" align="center">
          <Link to="/">Dashboard</Link>
          <Flex justify="flex-end" align="center" gap="md">
            {isAuthenticated ? (
              <>
                <div>{user!.email}</div>
                <Button onClick={logout}>Logout</Button>
              </>
            ) : (
              <>
                <Link to="/login">Login</Link>
                <Link to="/register">Register</Link>
              </>
            )}
          </Flex>
        </Flex>
      </AppShell.Header>
      <AppShell.Main>
        <Container>
          <Outlet />
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
