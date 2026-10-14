import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function SearchInput({ defaultValue = "", name = "q" }: { defaultValue?: string; name?: string }) {
  return (
    <div className="relative w-full">
      <label htmlFor={name} className="sr-only">Search by name or serial number</label>
      <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-slate-400" />
      <Input
        id={name}
        name={name}
        defaultValue={defaultValue}
        placeholder="Search by name or serial number…"
        className="h-11 rounded-lg border-slate-200 bg-slate-50 pl-10 pr-4 text-sm shadow-none placeholder:text-slate-400 focus-visible:bg-white focus-visible:ring-indigo-600/20"
      />
    </div>
  );
}
