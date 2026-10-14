"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { deleteRecord } from "@/actions/records";
import { Button } from "@/components/ui/button";

export function DeleteRecordButton({ recordId }: { recordId: string }) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    setError(null);
    setIsDeleting(true);
    try {
      const result = await deleteRecord(recordId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/admin");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        disabled={isDeleting}
        onClick={handleDelete}
      >
        {isDeleting ? "Deleting..." : "Delete"}
      </Button>
      {error ? <p role="alert" className="mt-1 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
