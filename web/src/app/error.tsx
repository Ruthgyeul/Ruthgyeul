"use client";

import { useEffect } from "react";
import { ErrorScreen } from "@/components/ErrorScreen";
import { color } from "@/lib/theme";

/**
 * Client error boundary. On a static site there is no real server 500, but if a
 * runtime error escapes React we render the 500 mockup instead of a blank page.
 */
export default function Error({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    // Surface the error for debugging; real logging can be wired here later.
    console.error(error);
  }, [error]);

  return (
    <ErrorScreen
      command="systemctl status portfolio.service"
      code="500"
      codeColor={color.yellow}
      message="Error: something went wrong on the server. It's been logged."
      details={[
        { key: "status", value: "500", valueColor: color.red },
        { key: "service", value: "'portfolio'" },
        { key: "action", value: "'retry shortly'" },
      ]}
    />
  );
}
