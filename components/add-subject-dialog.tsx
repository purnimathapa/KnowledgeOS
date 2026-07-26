"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { SubjectFormDialog } from "@/components/subject-form-dialog";
import { Button } from "@/components/ui/button";

export function AddSubjectDialog() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Subject
      </Button>
      <SubjectFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
