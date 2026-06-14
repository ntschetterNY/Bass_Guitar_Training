import { useEffect, useState } from "react";
import { api } from "../api";

type State = "checking" | "ok" | "down";

/** Small indicator that confirms the frontend can reach the backend API. */
export default function HealthBadge() {
  const [state, setState] = useState<State>("checking");

  useEffect(() => {
    let active = true;
    api
      .health()
      .then(() => active && setState("ok"))
      .catch(() => active && setState("down"));
    return () => {
      active = false;
    };
  }, []);

  const label =
    state === "ok"
      ? "Server connected"
      : state === "down"
        ? "Server unreachable"
        : "Connecting…";

  return (
    <div className={`health health--${state}`}>
      <span className="health__dot" />
      {label}
    </div>
  );
}
