import { Button } from "@mantine/core";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router";
import { useLoaderData } from "react-router";

export default function VerifyEmail() {
  const { state } = useLoaderData();

  if (state === "error") {
    return (
      <div>
        <h1>Error</h1>
        <p>There was an error with verifying your email.</p>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div>
        <h1>Success</h1>
        <p>Your email has been verified.</p>
        <Button component={Link} to="/">
          Go to dashboard <ChevronRight style={{ marginLeft: "0.5rem" }} />
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1>Email verification not fully implemented</h1>
      <p>
        Currently, Render doesn't allow outgoing requests from ports 465 and
        587, which interferes with sending SMTP requests to Gmail. As a
        temporary measure, you can click the button below to verify your email.
        This button is always accessible at{" "}
        <Link to="https://itransition-task4-frontend-eacx.onrender.com/verify-email">
          https://itransition-task4-frontend-eacx.onrender.com/verify-email
        </Link>
        .
      </p>
      <Button component={Link} to="/verify-email?verify=true">
        Verify email
      </Button>
    </div>
  );
}
