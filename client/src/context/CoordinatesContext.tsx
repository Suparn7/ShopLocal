import { createContext, useContext, useState } from "react";

interface Coordinates {
  lat: number;
  lng: number;
}

interface CoordinatesContextProps {
  coordinates: Coordinates | null;
  setCoordinates: (coordinates: Coordinates | null) => void;
}

const CoordinatesContext = createContext<CoordinatesContextProps | undefined>(undefined);

export function CoordinatesProvider({ children }: { children: React.ReactNode }) {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  console.log("CoordinatesProvider rendered by:", children);
  return (
    <CoordinatesContext.Provider value={{ coordinates, setCoordinates }}>
      {children}
    </CoordinatesContext.Provider>
  );
}

export function useCoordinates() {
    const context = useContext(CoordinatesContext);
    if (!context) {
      console.warn("useCoordinates called outside of CoordinatesProvider. Returning default value.");
      return { coordinates: null, setCoordinates: () => {} }; // Default fallback
    }
    return context;
  }