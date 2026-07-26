"use client";

import { MoreVertical } from "lucide-react";
import { useRef, useState } from "react";

import { SubjectFormDialog } from "@/components/subject-form-dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Subject } from "@/types";
import { createClient } from "@/utils/supabase/client";

type SubjectFolderTabProps = {
  subject: Subject;
  index: number;
  active: boolean;
  onSelect: () => void;
  onMutate: () => void;
};

export function SubjectFolderTab({
  subject,
  index,
  active,
  onSelect,
  onMutate,
}: SubjectFolderTabProps) {
  const tabRef = useRef<HTMLButtonElement>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [floating, setFloating] = useState(false);

  const indexLabel = String(index + 1).padStart(2, "0");

  function handlePointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = tabRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: py * -12, y: px * 14 });
    setFloating(true);
  }

  function handlePointerLeave() {
    setTilt({ x: 0, y: 0 });
    setFloating(false);
  }

  async function handleDelete() {
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.from("subjects").delete().eq("id", subject.id);
    setDeleting(false);
    if (error) return;
    setDeleteOpen(false);
    onMutate();
  }

  const glowStyle = active
    ? {
        boxShadow: `0 10px 28px -14px ${subject.color}55, 0 0 0 2px hsl(var(--ring))`,
      }
    : undefined;

  return (
    <>
      <div className="group relative flex w-full items-stretch gap-1">
        <button
          ref={tabRef}
          type="button"
          onClick={onSelect}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          className={cn(
            "folder-tab-shape relative flex min-h-[5rem] flex-1 flex-col justify-between border px-3 py-3 text-left transition-[transform,background-color,box-shadow] duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none",
            active
              ? "border-border paper-surface shadow-md"
              : "border-transparent bg-muted/60 hover:bg-muted/90"
          )}
          style={{
            transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(${floating ? -3 : 0}px)`,
            borderTopColor: subject.color,
            borderTopWidth: 3,
            ...glowStyle,
          }}
          aria-current={active ? "true" : undefined}
        >
          <span
            className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground"
            aria-hidden
          >
            {indexLabel}
          </span>
          <span className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
            {subject.name}
          </span>
          <span
            className="absolute left-3 top-0 h-2.5 w-12 rounded-b-[var(--radius)] opacity-95"
            style={{ backgroundColor: subject.color }}
            aria-hidden
          />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-auto shrink-0 self-center opacity-50 group-hover:opacity-100"
              aria-label={`Actions for ${subject.name}`}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setEditOpen(true)}>Edit</DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={() => setDeleteOpen(true)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <SubjectFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        subject={subject}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete subject?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes <strong>{subject.name}</strong> and linked study data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <Button variant="destructive" disabled={deleting} onClick={handleDelete}>
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
