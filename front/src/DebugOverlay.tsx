import { useContext, useState } from "react";
import { createContext, useCallback, useEffect } from "react";

interface JSONNodeProps {
  data: any;
  level?: number;
  expanded?: boolean;
}

export const useDebugHotkey = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "1") {
        setIsVisible((prev) => !prev);
      }
    };

    window.addEventListener("keypress", handleKeyPress);
    return () => window.removeEventListener("keypress", handleKeyPress);
  }, []);

  return isVisible;
};
export const useClearLocalStorageOn2 = () => {
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "2") {
        localStorage.clear();
      }
    };

    window.addEventListener("keypress", handleKeyPress);
    return () => window.removeEventListener("keypress", handleKeyPress);
  }, []);
};

export interface DebugOverlayProps {
  data: Record<string, unknown>;
}

export const DebugContext = createContext<{
  debugData: Record<string, unknown>;
  setDebugKey: (key: string, value: unknown) => void;
}>({ debugData: { test: "What" }, setDebugKey: () => {} });

export const DebugProvider = ({ children }: { children: React.ReactNode }) => {
  const [debugData, setDebugData] = useState<Record<string, unknown>>({});
  const setDebugKey = useCallback((key: string, value: unknown) => {
    setDebugData((prev) => {
      return { ...prev, [key]: value };
    });
  }, []);

  return (
    <DebugContext.Provider value={{ debugData, setDebugKey }}>
      {children}
    </DebugContext.Provider>
  );
};

export const useSetDebugContextKey = (key: string, value: unknown) => {
  const { setDebugKey, debugData } = useContext(DebugContext);
  useEffect(() => {
    if (window.location.hostname === "localhost") {
      setDebugKey(key, value);
    }
  }, [key, value, setDebugKey]);
};

const JSONNode = ({ data, level = 0, expanded = false }: JSONNodeProps) => {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const indent = "  ".repeat(level);

  if (data === null) return <span style={{ color: "#FF6347" }}>null</span>;
  if (data === undefined)
    return <span style={{ color: "#FF6347" }}>undefined</span>;
  if (typeof data === "string")
    return <span style={{ color: "#98FB98" }}>"{data}"</span>;
  if (typeof data === "number")
    return <span style={{ color: "#FFA07A" }}>{data}</span>;
  if (typeof data === "boolean")
    return <span style={{ color: "#FFA07A" }}>{data.toString()}</span>;
  if (data instanceof Date)
    return <span style={{ color: "#87CEEB" }}>{data.toISOString()}</span>;

  if (Array.isArray(data)) {
    if (!data.length) return <span>[]</span>;
    return (
      <span
      
      >
        <span
          onClick={() => setIsExpanded(!isExpanded)}
          style={{ cursor: "pointer", color: "#6495ED" }}
        >
          [{isExpanded ? "\n" : " ... "}
        </span>
        {isExpanded && (
          <>
            {data.map((item, index) => (
              <div key={index}>
                {indent} <JSONNode data={item} level={level + 1} expanded={true}/>
                {index < data.length - 1 && ","}
              </div>
            ))}
            {indent}]
          </>
        )}
        {!isExpanded && "]"}
      </span>
    );
  }

  if (typeof data === "object") {
    const entries = Object.entries(data);
    if (!entries.length) return <span>{"{}"}</span>;
    return (
      <span>
        <span
          onClick={() => setIsExpanded(!isExpanded)}
          style={{ cursor: "pointer", color: "#6495ED" }}
        >
          {"{"}
          {isExpanded ? "\n" : " ... "}
        </span>
        {isExpanded && (
          <>
            {entries.map(([key, value], index) => (
              <div key={key} className="text-left">
                {indent} <span style={{ color: "#6495ED" }}>"{key}"</span>:{" "}
                <JSONNode data={value} level={level + 1} expanded={true} />
                {index < entries.length - 1 && ","}
              </div>
            ))}
            {indent}
            {"}"}
          </>
        )}
        {!isExpanded && "}"}
      </span>
    );
  }

  return null;
};

const DebugOverlay = ({ data }: DebugOverlayProps) => {
  return (
    <>
      <pre
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          color: "white",
          margin: 0,
          padding: "20px",
          overflow: "auto",
          pointerEvents: "all",
          zIndex: 9998,
          fontFamily: "monospace",
        }}
      >
        <JSONNode data={data} expanded={true} />
      </pre>
    </>
  );
};

export const Debug = ({ isVisible }: { isVisible: boolean }) => {
  const { debugData } = useContext(DebugContext);
  if (!isVisible) return null;

  return <DebugOverlay data={debugData} />;
};
