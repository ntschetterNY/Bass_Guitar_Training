import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type AudioStatus =
  | "idle"
  | "starting"
  | "running"
  | "denied"
  | "error";

export interface AudioInputDevice {
  deviceId: string;
  label: string;
}

interface AudioContextValue {
  status: AudioStatus;
  error: string | null;
  devices: AudioInputDevice[];
  selectedDeviceId: string | null;
  /** Set once audio is running; detection hooks read from it. */
  analyser: AnalyserNode | null;
  sampleRate: number;
  /** Whether the browser exposes labelled input devices (false on iPad). */
  deviceSelectionSupported: boolean;
  start: (deviceId?: string) => Promise<void>;
  stop: () => void;
  selectDevice: (deviceId: string) => Promise<void>;
}

const Ctx = createContext<AudioContextValue | null>(null);

// Instrument signal must bypass voice processing or the pitch gets mangled.
function constraints(deviceId?: string): MediaStreamConstraints {
  const audio: MediaTrackConstraints = {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
    channelCount: 1,
  };
  if (deviceId) audio.deviceId = { exact: deviceId };
  return { audio, video: false };
}

export function AudioProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AudioStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<AudioInputDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [sampleRate, setSampleRate] = useState<number>(44100);

  const ctxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    const all = await navigator.mediaDevices.enumerateDevices();
    const inputs = all
      .filter((d) => d.kind === "audioinput")
      .map((d, i) => ({
        deviceId: d.deviceId,
        label: d.label || `Input ${i + 1}`,
      }));
    setDevices(inputs);
  }, []);

  const teardown = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    sourceRef.current?.disconnect();
    ctxRef.current?.close().catch(() => {});
    streamRef.current = null;
    sourceRef.current = null;
    ctxRef.current = null;
    setAnalyser(null);
  }, []);

  const start = useCallback(
    async (deviceId?: string) => {
      setStatus("starting");
      setError(null);
      try {
        // Tear down any previous graph (e.g. when switching devices).
        teardown();

        const stream = await navigator.mediaDevices.getUserMedia(
          constraints(deviceId),
        );
        streamRef.current = stream;

        const audioCtx = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext)();
        await audioCtx.resume();
        const source = audioCtx.createMediaStreamSource(stream);
        const node = audioCtx.createAnalyser();
        node.fftSize = 4096;
        node.smoothingTimeConstant = 0;
        // Connect source -> analyser only; never to destination (avoids feedback).
        source.connect(node);

        ctxRef.current = audioCtx;
        sourceRef.current = source;
        setAnalyser(node);
        setSampleRate(audioCtx.sampleRate);

        const activeId =
          deviceId ?? stream.getAudioTracks()[0]?.getSettings().deviceId ?? null;
        setSelectedDeviceId(activeId);

        // Labels are only available after permission is granted.
        await refreshDevices();
        setStatus("running");
      } catch (e) {
        teardown();
        const err = e as DOMException;
        if (err?.name === "NotAllowedError" || err?.name === "SecurityError") {
          setStatus("denied");
          setError("Microphone/input permission was denied.");
        } else {
          setStatus("error");
          setError(err?.message || String(e));
        }
      }
    },
    [refreshDevices, teardown],
  );

  const stop = useCallback(() => {
    teardown();
    setStatus("idle");
  }, [teardown]);

  const selectDevice = useCallback(
    async (deviceId: string) => {
      await start(deviceId);
    },
    [start],
  );

  useEffect(() => () => teardown(), [teardown]);

  // iPad Safari does not expose external USB interfaces in enumerateDevices,
  // so a meaningful picker only exists when >1 labelled input shows up.
  const deviceSelectionSupported =
    devices.filter((d) => d.deviceId && d.label).length > 1;

  return (
    <Ctx.Provider
      value={{
        status,
        error,
        devices,
        selectedDeviceId,
        analyser,
        sampleRate,
        deviceSelectionSupported,
        start,
        stop,
        selectDevice,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAudio(): AudioContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAudio must be used within <AudioProvider>");
  return v;
}
