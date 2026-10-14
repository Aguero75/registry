import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function FileInput({
  name = "file",
  label = "Document",
  onChange,
  disabled = false,
  error,
}: {
  name?: string;
  label?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  disabled?: boolean;
  error?: string | null;
}) {
  return (
    <div className="space-y-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
      <Label htmlFor={name} className="text-sm font-medium text-slate-700">{label}</Label>
      <Input
        id={name}
        name={name}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-error` : undefined}
        disabled={disabled}
        onChange={onChange}
        className="h-auto min-h-10 border-slate-200 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-indigo-700"
      />
      {error ? (
        <p id={`${name}-error`} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
