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
import { Form, useNavigate } from "react-router";
import { Link, useActionData } from "react-router";
import { useAuth } from "../../state/useAuth";

export default function Register() {
  const actionData = useActionData();
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (actionData && !actionData.error) {
      login(actionData);
      navigate("/verify-email");
    }
  }, [actionData, login, navigate]);

  return (
    <Container>
      <Title mb="md">Register</Title>
      {actionData && actionData.error && (
        <>
          <Alert color="red">{actionData.error}</Alert>
          <Space h="md" />
        </>
      )}
      <Form method="post">
        <Stack>
          <TextInput name="email" placeholder="Email" />
          <TextInput name="name" placeholder="Name" />
          <TextInput name="title" placeholder="Title" />
          <PasswordInput
            name="password"
            placeholder="Password"
            type="password"
          />
          <Button type="submit">Register</Button>
        </Stack>
      </Form>
      <Divider my="md" />
      <Text>
        <span>Already have an account?</span>
        <Link style={{ marginLeft: "0.25rem" }} to="/login">
          Log in
        </Link>
      </Text>
    </Container>
  );
}
