import { useState } from "react";
import { useIdentity } from "../context/IdentityContext";

const IdentityBadge = () => {
  const { identity, rename } = useIdentity();
  const [name, setName] = useState(identity.name);

  return (
    <label className="flex items-center gap-2 text-sm">
      <span
        aria-hidden
        className="size-3 rounded-full"
        style={{ background: identity.color }}
      />
      <input
        aria-label="Your display name"
        className="w-[96px] border-b border-transparent focus:border-gray-400 focus:outline-none"
        onBlur={() => setName(identity.name)}
        onChange={(e) => {
          setName(e.target.value);
          rename(e.target.value);
        }}
        value={name}
      />
    </label>
  );
};

export default IdentityBadge;
