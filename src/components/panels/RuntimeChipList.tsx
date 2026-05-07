export interface RuntimeChip {
  key?: string;
  label: string;
  value: string;
  tone?: string;
}

export function RuntimeChipList({ chips }: { chips: RuntimeChip[] }) {
  return (
    <>
      {chips.map((chip, index) => (
        <span
          className="runtime-chip"
          data-runtime-source={chip.tone}
          key={chip.key ?? `${chip.label}-${chip.value}-${index}`}
        >
          <b>{chip.label}</b>
          {chip.value}
        </span>
      ))}
    </>
  );
}
