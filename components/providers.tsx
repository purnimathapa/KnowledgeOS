"use client";

import { ThemeProvider } from "next-themes";

import { CommandPaletteProvider } from "@/components/command-palette/command-palette-provider";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" forcedTheme="light" enableSystem={false}>
      <CommandPaletteProvider>
        {children}
        <Toaster richColors closeButton position="top-center" />
      </CommandPaletteProvider>
    </ThemeProvider>
  );
}
