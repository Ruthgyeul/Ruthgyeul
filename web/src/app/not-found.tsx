"use client";

import { useEffect, useState } from "react";
import { ErrorScreen } from "@/components/ErrorScreen";
import { color } from "@/lib/theme";

export default function NotFound() {
  // Reflect the actual requested path once we're on the client.
  const [path, setPath] = useState("/unknown");
  useEffect(() => {
    setPath(window.location.pathname || "/unknown");
  }, []);

  return (
    <ErrorScreen
      command={`curl ${path}`}
      code="404"
      codeColor={color.red}
      message="Error: requested path was not found on this server."
      details={[
        { key: "status", value: "404", valueColor: color.yellow },
        { key: "message", value: "'page not found'" },
        { key: "path", value: `'${path}'` },
      ]}
    />
  );
}
