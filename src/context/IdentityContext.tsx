import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/**
 * This IdentityContext is primarily a cosmetic solution,
 * localStorage is not reliable for identidy handling and should be handled in BE.
 *
 * I just wanted it to be a little less boring than just saying "Me" so animals and colors is what you got.
 * Good thing is that if you don't want to be a curious penguin you can rename yourself.
 */

const STORAGE_KEY = "collab-canvas:identity";

const ADJECTIVES = [
  "Bold",
  "Calm",
  "Curious",
  "Eager",
  "Fuzzy",
  "Gentle",
  "Lucky",
  "Merry",
  "Quiet",
  "Swift",
];

const ANIMALS = [
  "Llama",
  "Otter",
  "Penguin",
  "Badger",
  "Falcon",
  "Gecko",
  "Owl",
  "Lynx",
  "Moose",
  "Walrus",
];

const COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

export type Identity = {
  color: string;
  id: string;
  name: string;
};

type IdentityContextType = {
  identity: Identity;
  rename: (name: string) => void;
};

const IdentityContext = createContext<IdentityContextType | null>(null);

const pick = <T,>(values: T[]) =>
  values[Math.floor(Math.random() * values.length)];

const createIdentity = (): Identity => ({
  color: pick(COLORS),
  id: crypto.randomUUID(),
  name: `${pick(ADJECTIVES)} ${pick(ANIMALS)}`,
});

const getStoredIdentity = (): Identity => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY) ?? "";
    const parsed = JSON.parse(stored);

    return parsed?.id ? (parsed as Identity) : createIdentity();
  } catch {
    return createIdentity();
  }
};

export const IdentityProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [identity, setIdentity] = useState<Identity>(getStoredIdentity);

  const rename = useCallback((name: string) => {
    const trimmed = name.trim();

    if (!trimmed) return;

    setIdentity((current) => ({ ...current, name: trimmed }));
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
    } catch {
      // storage unavailable, do nothing for now
    }
  }, [identity]);

  const value = useMemo(() => ({ identity, rename }), [identity, rename]);

  return (
    <IdentityContext.Provider value={value}>
      {children}
    </IdentityContext.Provider>
  );
};

export const useIdentity = () => {
  const context = useContext(IdentityContext);

  if (!context) {
    throw new Error("useIdentity must be used within an IdentityProvider");
  }

  return context;
};
