"use client";

import { useSyncExternalStore } from "react";
import { ErrorScreen } from "@/components/ErrorScreen";
import { color } from "@/lib/theme";

const subscribe = () => () => {}; // the path never changes for a given render

export default function NotFound() {
  // Reflect the actual requested path on the client; "/unknown" during SSR.
  const path = useSyncExternalStore(
    subscribe,
    () => window.location.pathname || "/unknown",
    () => "/unknown",
  );

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
