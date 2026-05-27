export default function CitationChip({ citation }) {
  return (
    <button
      type="button"
      aria-label={`Open citation ${citation}`}
      className="
        mx-1
        rounded-full
        border
        border-primary/20
        bg-primary/5
        px-2
        py-0.5
        text-[10px]
        font-medium
        text-primary
        transition-colors
        hover:bg-primary/10
        focus:outline-none
        focus:ring-2
        focus:ring-primary
      "
    >
      [{citation}]
    </button>
  );
}