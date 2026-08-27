import type { ReactNode } from "react";
import { parchmentClass, panelKickerClass, tagListClass } from "@/lib/ui-styles";
import { cn } from "@/lib/utils";

export function PanelFrame({ children, tv = false }: { children: ReactNode; tv?: boolean }) {
  return (
    <div
      className={cn(
        parchmentClass,
        tv && [
          "border-[#17110e] text-[#d8f1cb]",
          "bg-[repeating-linear-gradient(0deg,rgba(113,156,102,.06)_0_2px,transparent_2px_5px),radial-gradient(circle_at_50%_42%,#183d32,#071713_72%)]",
          "shadow-[inset_0_0_0_5px_#345a46,inset_0_0_32px_rgba(0,0,0,.78)]",
          "before:border-[#4d2a1a] before:bg-[#b37337] after:border-[#4d2a1a] after:bg-[#b37337]",
          "[&_[data-slot=dialog-title]]:text-[#f0d27c] [&_[data-slot=dialog-description]]:text-[#d8f1cb]",
        ],
      )}
    >
      {children}
    </div>
  );
}

export function PanelKicker({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn(panelKickerClass, className)}>{children}</p>;
}

export function TagList({ items, tv = false }: { items: string[]; tv?: boolean }) {
  return (
    <div
      className={cn(
        tagListClass,
        tv && "[&>span]:border-[rgba(190,223,153,.35)] [&>span]:bg-[rgba(160,208,140,.11)] [&>span]:text-[#e7f5d9]",
      )}
    >
      {items.map((item) => <span key={item}>{item}</span>)}
    </div>
  );
}
