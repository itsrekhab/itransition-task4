import {
  ActionIcon,
  Button,
  Checkbox,
  Container,
  Group,
  Stack,
  Table,
  Text,
  Tooltip,
} from "@mantine/core";
import { useEffect, useState } from "react";
// import { useRevalidator } from "react-router";
import { useLoaderData } from "react-router";
import { fetchWithAuth } from "../utils/api";
import { useSearchParams } from "react-router";
import {
  MoveDown,
  MoveUp,
  BrushCleaning,
  Lock,
  LockOpen,
  Trash,
} from "lucide-react";
import { intlFormatDistance } from "date-fns";

type User = {
  id: number;
  name: string;
  email: string;
  title: string;
  status: string;
  lastLoginAt: string;
  isBlocked: boolean;
};

function SortableTh({
  field,
  label,
  onClick,
  sortBy,
  order,
}: {
  field: string;
  label: string;
  onClick: () => void;
  sortBy: string;
  order: string;
}) {
  return (
    <Table.Th
      onClick={onClick}
      style={{ cursor: "pointer", userSelect: "none" }}
    >
      <Group gap="xs" wrap="nowrap">
        {label}
        {sortBy === field ? (
          order === "asc" ? (
            <MoveUp size={16} />
          ) : (
            <MoveDown size={16} />
          )
        ) : null}
      </Group>
    </Table.Th>
  );
}

export default function Dashboard() {
  const loaderData = useLoaderData();
  const [users, setUsers] = useState<User[]>(loaderData);

  useEffect(() => {
    setUsers(loaderData);
  }, [loaderData]);

  // const revalidator = useRevalidator();
  const [searchParams, setSearchParams] = useSearchParams();

  const sortBy = searchParams.get("sortBy") || "lastLoginAt";
  const order = searchParams.get("order") || "desc";

  const handleSort = (field: string) => {
    const nextOrder = sortBy === field && order === "asc" ? "desc" : "asc";
    setSearchParams((prev) => {
      prev.set("sortBy", field);
      prev.set("order", nextOrder);
      return prev;
    });
  };

  const [selection, setSelection] = useState<Set<number>>(new Set());

  const allSelected = selection.size === users.length;
  const anySelected = selection.size > 0;
  const indeterminate = anySelected && !allSelected;

  function handleCheckboxChange(id: number) {
    const newSelection = new Set(selection);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelection(newSelection);
  }

  function handleGlobalCheckboxChange() {
    if (allSelected) {
      setSelection(new Set());
    } else {
      setSelection(new Set(users.map((user) => user.id)));
    }
  }

  function getSelectedUsers() {
    return users.filter((user) => selection.has(user.id));
  }

  function clearSelection() {
    setSelection(new Set());
  }

  async function handleBlock() {
    const selectedUsers = getSelectedUsers();
    const response = await fetchWithAuth(
      `${import.meta.env.VITE_BACKEND_URL}/block`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ users: selectedUsers.map((user) => user.id) }),
      },
    );
    if (!response.ok) {
      throw new Error("Failed to block users");
    }
    selectedUsers.forEach((user) => {
      user.isBlocked = true;
    });
    setUsers([...users]);
    clearSelection();
    // revalidator.revalidate();
  }

  async function handleUnblock() {
    const selectedUsers = getSelectedUsers();
    const response = await fetchWithAuth(
      `${import.meta.env.VITE_BACKEND_URL}/unblock`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ users: selectedUsers.map((user) => user.id) }),
      },
    );
    if (!response.ok) {
      throw new Error("Failed to unblock users");
    }
    selectedUsers.forEach((user) => {
      user.isBlocked = false;
    });
    setUsers([...users]);
    clearSelection();
    // revalidator.revalidate();
  }

  async function handleDelete() {
    const selectedUsers = getSelectedUsers();
    const response = await fetchWithAuth(
      `${import.meta.env.VITE_BACKEND_URL}/delete`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ users: selectedUsers.map((user) => user.id) }),
      },
    );
    if (!response.ok) {
      throw new Error("Failed to delete users");
    }
    setUsers(users.filter((user) => !selectedUsers.includes(user)));
    clearSelection();
    // revalidator.revalidate();
  }

  async function handleDeleteUnverified() {
    const response = await fetchWithAuth(
      `${import.meta.env.VITE_BACKEND_URL}/delete-unverified`,
      {
        method: "DELETE",
      },
    );
    if (!response.ok) {
      throw new Error("Failed to delete unverified users");
    }
    setUsers(users.filter((user) => user.status !== "Unverified"));
    clearSelection();
    // revalidator.revalidate();
  }

  return (
    <Stack>
      <Group gap="sm">
        <Button
          variant="outline"
          size="sm"
          disabled={!anySelected}
          onClick={handleBlock}
        >
          <span style={{ marginRight: "0.5rem" }}>Block</span>
          <Lock />
        </Button>
        <Tooltip label="Unblock selected users">
          <ActionIcon
            size="input-sm"
            variant="outline"
            disabled={!anySelected}
            onClick={handleUnblock}
          >
            <LockOpen />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Delete selected users">
          <ActionIcon
            size="input-sm"
            variant="outline"
            color="red"
            disabled={!anySelected}
            onClick={handleDelete}
          >
            <Trash />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Delete unverified users">
          <ActionIcon
            size="input-sm"
            variant="outline"
            onClick={handleDeleteUnverified}
          >
            <BrushCleaning />
          </ActionIcon>
        </Tooltip>
      </Group>
      <Container
        w="100%"
        p={0}
        style={{ border: "1px solid #ccc", borderRadius: "0.25rem" }}
      >
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>
                <Checkbox
                  checked={allSelected}
                  onChange={handleGlobalCheckboxChange}
                  indeterminate={indeterminate}
                />
              </Table.Th>
              <SortableTh
                field="name"
                label="Name"
                onClick={() => handleSort("name")}
                sortBy={sortBy}
                order={order}
              />
              <SortableTh
                field="email"
                label="Email"
                onClick={() => handleSort("email")}
                sortBy={sortBy}
                order={order}
              />
              <SortableTh
                field="status"
                label="Status"
                onClick={() => handleSort("status")}
                sortBy={sortBy}
                order={order}
              />
              <SortableTh
                field="lastLoginAt"
                label="Last seen"
                onClick={() => handleSort("lastLoginAt")}
                sortBy={sortBy}
                order={order}
              />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {users.map((user) => (
              <Table.Tr key={user.id} c={user.isBlocked ? "dimmed" : ""}>
                <Table.Td>
                  <Checkbox
                    onChange={() => handleCheckboxChange(user.id)}
                    checked={selection.has(user.id)}
                  />
                </Table.Td>
                <Table.Td>
                  <Text size="sm" td={user.isBlocked ? "line-through" : ""}>
                    {user.name}
                  </Text>
                  {user.title ? (
                    <Text size="sm">{user.title}</Text>
                  ) : (
                    <Text size="sm">N/A</Text>
                  )}
                </Table.Td>
                <Table.Td>{user.email}</Table.Td>
                <Table.Td>{user.isBlocked ? "Blocked" : user.status}</Table.Td>
                <Table.Td>
                  <Tooltip label={intlFormatDistance(new Date(user.lastLoginAt), new Date(), { locale: "en" })}>
                    <Text size="sm">
                      {new Date(user.lastLoginAt).toLocaleString("en")}
                    </Text>
                  </Tooltip>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Container>
    </Stack>
  );
}

export function ErrorBoundary() {
  return <Container>Failed to fetch users</Container>;
}
