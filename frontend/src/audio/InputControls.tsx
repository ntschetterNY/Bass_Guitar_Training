import { useAudio } from "./AudioProvider";
import { useLevel } from "./useLevel";

/**
 * Shared audio-input panel: start/stop, device picker (desktop), and a live
 * level meter so you can confirm the Focusrite signal before practicing.
 * On iPad there's no device picker (Safari hides USB interfaces) — iOS routes
 * the Focusrite automatically, so we show guidance instead.
 */
export default function InputControls() {
  const {
    status,
    error,
    devices,
    selectedDeviceId,
    analyser,
    deviceSelectionSupported,
    start,
    stop,
    selectDevice,
  } = useAudio();
  const level = useLevel(analyser);

  if (status !== "running") {
    return (
      <div className="input-panel">
        <button
          className="btn btn--primary"
          disabled={status === "starting"}
          onClick={() => start()}
        >
          {status === "starting" ? "Starting…" : "🎙️ Enable input"}
        </button>
        {status === "denied" && (
          <p className="error">
            Input permission was blocked. Allow microphone access for this site
            and try again.
          </p>
        )}
        {status === "error" && <p className="error">{error}</p>}
        <p className="muted small">
          Plug in your Focusrite first. On iPad, tap Enable and play a note —
          iOS uses the interface automatically (use input 1).
        </p>
      </div>
    );
  }

  return (
    <div className="input-panel input-panel--row">
      <div className="meter" aria-label="input level">
        <div
          className="meter__fill"
          style={{ width: `${Math.round(level * 100)}%` }}
        />
      </div>

      {deviceSelectionSupported ? (
        <select
          className="select"
          value={selectedDeviceId ?? ""}
          onChange={(e) => selectDevice(e.target.value)}
        >
          {devices.map((d) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label}
            </option>
          ))}
        </select>
      ) : (
        <span className="muted small">Using system input</span>
      )}

      <button className="btn" onClick={stop}>
        Stop
      </button>
    </div>
  );
}
