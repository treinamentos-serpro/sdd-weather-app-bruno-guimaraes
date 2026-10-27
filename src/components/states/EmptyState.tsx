interface EmptyStateProps {
  title: string;
  hint: string;
}

export default function EmptyState({ title, hint }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center font-sans text-white shadow-glass backdrop-blur-md">
      <h2 className="break-words text-xl font-semibold">{title}</h2>
      <p className="mt-2 break-words text-white/70">{hint}</p>
    </div>
  );
}
