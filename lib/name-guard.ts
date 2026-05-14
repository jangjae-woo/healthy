function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

function compactName(name: string): string {
  return normalizeName(name).replace(/\s+/g, "");
}

export function buildNameVariants(name: string): string[] {
  const clean = normalizeName(name);
  const compact = compactName(clean);
  const chars = Array.from(compact);
  const variants = new Set<string>();
  if (chars.length < 2) return [];

  for (let i = 0; i < chars.length; i++) {
    variants.add(chars.slice(0, i + 1).join("") + chars[i] + chars.slice(i + 1).join(""));
  }
  for (let i = 0; i < chars.length - 1; i++) {
    variants.add(chars.slice(0, i + 1).join("") + chars.slice(i).join(""));
  }
  variants.delete(compact);
  variants.delete(clean);
  return [...variants].sort((a, b) => b.length - a.length);
}

export function protectNames(text: string, names: string[]): string {
  let out = text;
  for (const rawName of names) {
    const name = normalizeName(rawName);
    const compact = compactName(name);
    if (!compact) continue;

    for (const variant of buildNameVariants(name)) {
      out = out.replace(new RegExp(escapeRegExp(variant), "g"), name);
    }

    if (name !== compact) {
      out = out.replace(new RegExp(escapeRegExp(compact), "g"), name);
    }
  }
  return out;
}

export function createNameGuard(names: string[]) {
  const maxVariantLength = Math.max(
    0,
    ...names.flatMap((name) => [compactName(name), ...buildNameVariants(name)].map((v) => v.length)),
  );
  const holdLength = Math.max(8, maxVariantLength + 2);
  let buffer = "";

  return {
    push(text: string): string {
      buffer += text;
      if (buffer.length <= holdLength) return "";
      const emitLength = buffer.length - holdLength;
      const stable = buffer.slice(0, emitLength);
      buffer = buffer.slice(emitLength);
      return protectNames(stable, names);
    },
    flush(): string {
      const rest = protectNames(buffer, names);
      buffer = "";
      return rest;
    },
  };
}
