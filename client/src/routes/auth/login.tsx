import {
  Alert,
  Button,
  Container,
  Divider,
  PasswordInput,
  Space,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useEffect } from "react";
import { useActionData } from "react-router";
import { Form } from "react-router";
import { useAuth } from "../../state/useAuth";
import { Link } from "react-router";
import { useNavigate } from "react-router";

export default function Login() {
  const actionData = useActionData();
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (actionData && !actionData.error) {
      login(actionData);
      navigate("/");
    }
  }, [actionData, login, navigate]);

  return (
    <Container>
      <Title mb="md">Login</Title>
      {actionData && actionData.error && (
        <>
          <Alert color="red">{actionData.error}</Alert>
          <Space h="md" />
        </>
      )}
      <Form action="/login" method="post">
        <Stack>
          <TextInput name="email" placeholder="Email" />
          <PasswordInput
            name="password"
            placeholder="Password"
            type="password"
          />
          <Button type="submit">Log in</Button>
        </Stack>
      </Form>
      <Divider my="md" />
      <Text>
        <span>Don't have an account?</span>
        <Link style={{ marginLeft: "0.25rem" }} to="/register">
          Register
        </Link>
      </Text>
    </Container>
  );
}
