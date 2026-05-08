function getVisualTone(seed: string) {
  const toneIndex =
    Array.from(seed).reduce((total, character) => {
      return total + character.charCodeAt(0);
    }, 0) % 4;

  return `asset-thumb-${toneIndex + 1}`;
}

function getVisualKind(seed: string) {
  const normalizedSeed = seed.toLowerCase();

  if (normalizedSeed.includes("chair") || normalizedSeed.includes("aurora")) {
    return "asset-thumb-chair";
  }

  if (normalizedSeed.includes("sofa") || normalizedSeed.includes("triæpiece")) {
    return "asset-thumb-sofa";
  }

  if (normalizedSeed.includes("coffee") || normalizedSeed.includes("tbl")) {
    return "asset-thumb-tabletop";
  }

  if (normalizedSeed.includes("lamp") || normalizedSeed.includes("lmp") || normalizedSeed.includes("lumen")) {
    return "asset-thumb-lamp";
  }

  if (normalizedSeed.includes("watch") || normalizedSeed.includes("ffcs")) {
    return "asset-thumb-watch";
  }

  if (normalizedSeed.includes("fragrance") || normalizedSeed.includes("npr")) {
    return "asset-thumb-bottle";
  }

  if (seed.includes("极光") || seed.includes("椅")) {
    return "asset-thumb-chair";
  }

  if (seed.includes("三件套") || seed.includes("沙发")) {
    return "asset-thumb-sofa";
  }

  if (seed.includes("台灯") || seed.includes("灯具") || seed.includes("流明")) {
    return "asset-thumb-lamp";
  }

  if (seed.includes("香氛") || seed.includes("瓶")) {
    return "asset-thumb-bottle";
  }

  return "asset-thumb-product";
}

export function AssetThumb({
  seed,
  label,
  size = "compact"
}: {
  seed: string;
  label: string;
  size?: "compact" | "table";
}) {
  return (
    <span
      aria-label={label}
      className={`asset-thumb asset-thumb-${size} ${getVisualTone(seed)} ${getVisualKind(seed)}`}
      role="img"
    >
      <i />
      <b />
    </span>
  );
}
