import { Search } from 'lucide-react';

export function SearchBar({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-3 py-2 rounded-md bg-surface border border-border text-sm placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-shadow"
      />
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-muted text-sm">
      <p>{message}</p>
    </div>
  );
}
