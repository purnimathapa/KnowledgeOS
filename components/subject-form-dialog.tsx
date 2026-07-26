"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Subject } from "@/types";
import { createClient } from "@/utils/supabase/client";

export const PRESET_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f97316",
  "#22c55e",
  "#06b6d4",
  "#eab308",
  "#ef4444",
];

type SubjectFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject?: Subject | null;
};

export function SubjectFormDialog({
  open,
  onOpenChange,
  subject = null,
}: SubjectFormDialogProps) {
  const router = useRouter();
  const formId = useId();
  const isEdit = subject !== null;
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (subject) {
      setName(subject.name);
      setColor(subject.color);
    } else {
      setName("");
      setColor(PRESET_COLORS[0]);
    }
    setError(null);
  }, [open, subject]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const trimmedName = name.trim();

      if (isEdit && subject) {
        const { error: updateError } = await supabase
          .from("subjects")
          .update({ name: trimmedName, color })
          .eq("id", subject.id);

        if (updateError) {
          setError(updateError.message);
          toast.error("Could not update subject", {
            description: updateError.message,
          });
          return;
        }

        toast.success("Subject updated");
      } else {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          const message = "You must be signed in to add a subject.";
          setError(message);
          toast.error(message);
          return;
        }

        const { error: insertError } = await supabase.from("subjects").insert({
          name: trimmedName,
          color,
          user_id: user.id,
        });

        if (insertError) {
          setError(insertError.message);
          toast.error("Could not create subject", {
            description: insertError.message,
          });
          return;
        }

        toast.success("Subject created");
      }

      onOpenChange(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit subject" : "New subject"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the name or color for this subject."
              : "Create a study subject for your workspace."}
          </DialogDescription>
        </DialogHeader>
        <form id={formId} onSubmit={handleSubmit} className="space-y-4">
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor={`${formId}-name`}>Name</Label>
            <Input
              id={`${formId}-name`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Organic Chemistry"
              required
              maxLength={80}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${formId}-color`}>Color</Label>
            <div className="flex flex-wrap items-center gap-2">
              {PRESET_COLORS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  aria-label={`Select color ${preset}`}
                  className="h-8 w-8 rounded-full border-2 transition-transform hover:scale-105"
                  style={{
                    backgroundColor: preset,
                    borderColor:
                      color === preset ? "hsl(var(--foreground))" : "transparent",
                  }}
                  onClick={() => setColor(preset)}
                />
              ))}
              <Input
                id={`${formId}-color`}
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-14 cursor-pointer p-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEdit ? "Saving…" : "Creating…"}
                </>
              ) : isEdit ? (
                "Save changes"
              ) : (
                "Create subject"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
