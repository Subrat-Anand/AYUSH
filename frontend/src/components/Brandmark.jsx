import React from "react";
import { Leaf } from "lucide-react";

export default function Brandmark({ light }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`flex items-center justify-center rounded-full w-[34px] h-[34px] ${
          light ? "bg-white/15" : "bg-leaf"
        }`}
      >
        <Leaf size={18} color="#F3ECD9" />
      </span>
      <span className={`font-serif text-[22px] tracking-wide ${light ? "text-parchment" : "text-ink"}`}>
        Ayush
      </span>
    </div>
  );
}
