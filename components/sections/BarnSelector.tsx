"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, MapPin, X, Calendar } from "lucide-react";
import { SaleBarn } from "@/lib/types";

interface BarnSelectorProps {
  barns: SaleBarn[];
  selected: string[];
  onChange: (slugs: string[]) => void;
}

export function BarnSelector({ barns, selected, onChange }: BarnSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const toggle = (slug: string) => {
    if (selected.includes(slug)) {
      onChange(selected.filter((s) => s !== slug));
    } else {
      onChange([...selected, slug]);
    }
  };

  const selectAll = () => onChange(barns.map((b) => b.slug));
  const clearAll = () => onChange([]);

  const selectedBarns = barns.filter((b) => selected.includes(b.slug));

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors w-full sm:w-auto"
      >
        <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
        <span className="truncate">
          {selected.length === 0
            ? "Select sale barns..."
            : selected.length === barns.length
              ? "All barns selected"
              : `${selected.length} barn${selected.length > 1 ? "s" : ""} selected`}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Selected tags */}
      {selectedBarns.length > 0 && selectedBarns.length < barns.length && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selectedBarns.map((barn) => (
            <span
              key={barn.slug}
              className="inline-flex items-center gap-1 px-2 py-1 bg-cornhusker-50 text-cornhusker-700 rounded-md text-xs font-medium"
            >
              {barn.city === "Statewide" ? barn.name : barn.city}
              <button
                type="button"
                onClick={() => toggle(barn.slug)}
                className="hover:text-cornhusker-900"
                aria-label={`Remove ${barn.name}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full sm:w-80 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {/* Actions */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Nebraska Sale Barns
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="text-xs text-cornhusker-600 hover:text-cornhusker-700 font-medium"
              >
                All
              </button>
              <span className="text-gray-300">|</span>
              <button
                type="button"
                onClick={clearAll}
                className="text-xs text-gray-500 hover:text-gray-700 font-medium"
              >
                None
              </button>
            </div>
          </div>

          {/* Barn list */}
          <ul className="max-h-72 overflow-y-auto py-1" role="listbox" aria-multiselectable="true">
            {barns.map((barn) => {
              const isSelected = selected.includes(barn.slug);
              return (
                <li key={barn.slug} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    onClick={() => toggle(barn.slug)}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 text-left hover:bg-gray-50 transition-colors ${
                      isSelected ? "bg-cornhusker-50/50" : ""
                    }`}
                  >
                    <div
                      className={`flex items-center justify-center w-4 h-4 rounded border shrink-0 ${
                        isSelected
                          ? "bg-cornhusker-600 border-cornhusker-600"
                          : "border-gray-300"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {barn.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {barn.city !== "Statewide" ? `${barn.city}, ${barn.state}` : barn.state}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                      <Calendar className="w-3 h-3" />
                      {barn.reportDay}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
