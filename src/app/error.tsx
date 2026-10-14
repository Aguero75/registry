"use client";

export default function Error() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="rounded-xl border border-destructive bg-destructive/10 p-6 text-center">
        <h2 className="text-xl font-semibold">Something went wrong.</h2>
        <p className="mt-2 text-sm text-muted-foreground">Try refreshing the page.</p>
      </div>
    </main>
  );
}
