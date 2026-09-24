export const pixelButtonClass = [
  "inline-flex min-h-11 items-center justify-center gap-2 px-4 py-2.5",
  "border-[3px] border-[#2d1814] bg-[#9b542e] text-[#fff2c4] no-underline",
  "font-black shadow-[inset_0_0_0_2px_#d58a48,0_3px_0_#2d150e]",
  "transition-[transform,filter] hover:-translate-y-0.5 hover:brightness-105",
  "focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#fff0b6]",
  "disabled:pointer-events-none disabled:opacity-55",
].join(" ");

export const paperSurfaceClass = [
  "bg-[#f6d99c] text-[#4b2b22]",
  "border-[5px] border-[#52291d]",
  "shadow-[inset_0_0_0_3px_#ffedbd,0_6px_0_rgba(48,23,14,.38)]",
].join(" ");

export const parchmentClass = [
  "relative min-h-80 border-[3px] border-[#6f3d25]",
  "bg-[linear-gradient(90deg,rgba(139,82,42,.15),transparent_8%_92%,rgba(139,82,42,.15)),#f6d99c]",
  "p-[clamp(1.35rem,4vw,2.7rem)] text-[#4b2b22]",
  "shadow-[inset_0_0_0_4px_#ffedbd]",
  "before:absolute before:left-4 before:top-3 before:size-[15px] before:rounded-full",
  "before:border-[3px] before:border-[#1e303d] before:bg-[#31516a] before:content-['']",
  "after:absolute after:right-4 after:top-3 after:size-[15px] after:rounded-full",
  "after:border-[3px] after:border-[#1e303d] after:bg-[#31516a] after:content-['']",
  "[&_[data-slot=dialog-title]]:text-[clamp(1.5rem,4vw,2.25rem)]",
  "[&_[data-slot=dialog-title]]:leading-[1.15] [&_[data-slot=dialog-title]]:text-[#6f3b25]",
  "[&_[data-slot=dialog-description]]:text-[.98rem]",
  "[&_[data-slot=dialog-description]]:leading-[1.55] [&_[data-slot=dialog-description]]:text-[#674638]",
  "[&>p]:my-4 [&>p]:font-bold [&>p]:leading-[1.65]",
].join(" ");

export const panelKickerClass =
  "mb-2 text-[.78rem] font-black uppercase tracking-[.08em] text-[#91502c]";

export const tagListClass =
  "mt-3 flex flex-wrap gap-1.5 [&>span]:border-2 [&>span]:border-[rgba(89,46,27,.36)] [&>span]:bg-[rgba(104,55,31,.13)] [&>span]:px-2 [&>span]:py-1 [&>span]:text-xs [&>span]:font-black";
