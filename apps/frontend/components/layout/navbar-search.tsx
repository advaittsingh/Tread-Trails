"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { useProductCatalog } from "@/contexts/product-catalog-context";
import { cn } from "@/lib/utils";

import { Input } from "@/components/ui/input";

export function NavbarSearch({
  className,
  onNavigate,
}: {
  className?: string;
  /** Called after navigating from suggestions (e.g. close mobile sheet). */
  onNavigate?: () => void;
}) {
  const reactId = useId();
  const inputId = `${reactId}-catalog-search`;
  const listId = `${reactId}-product-suggestions`;
  const router = useRouter();
  const { searchProducts } = useProductCatalog();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const results = searchProducts(q, 8);
  const showList = open && q.trim().length >= 2 && results.length > 0;

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const navigateTo = useCallback(
    (slug: string) => {
      router.push(`/product/${slug}`);
      setQ("");
      setOpen(false);
      setActive(-1);
      onNavigate?.();
    },
    [router, onNavigate]
  );

  return (
    <div ref={wrapRef} className={cn("relative w-full min-w-0", className)}>
      <div className="relative">
        <label htmlFor={inputId} className="sr-only">
          Search catalog products
        </label>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          id={inputId}
          type="search"
          value={q}
          aria-expanded={showList}
          aria-controls={showList ? listId : undefined}
          aria-activedescendant={
            showList && active >= 0 ? `${listId}-option-${active}` : undefined
          }
          aria-autocomplete="list"
          role="combobox"
          placeholder="Search products"
          autoComplete="off"
          className="h-8 rounded-full border-primary/20 bg-background/50 pl-9 pr-3 text-sm shadow-none backdrop-blur-[6px] placeholder:text-muted-foreground/80 focus-visible:border-primary/35 focus-visible:ring-primary/20"
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => {
            if (q.trim().length >= 2) setOpen(true);
          }}
          onKeyDown={(e) => {
            if (!showList) {
              if (e.key === "Escape") setOpen(false);
              return;
            }
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((i) => {
                if (results.length === 0) return -1;
                if (i < 0) return 0;
                return Math.min(results.length - 1, i + 1);
              });
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((i) => Math.max(0, i - 1));
            } else if (e.key === "Enter") {
              e.preventDefault();
              const idx = active >= 0 ? active : 0;
              const p = results[idx];
              if (p) navigateTo(p.slug);
            } else if (e.key === "Escape") {
              setOpen(false);
              setActive(-1);
            }
          }}
        />
      </div>
      {showList ? (
        <ul
          id={listId}
          role="listbox"
          aria-label="Product suggestions"
          className="absolute top-full z-50 mt-1 max-h-[min(60vh,320px)] w-full overflow-auto rounded-xl border border-border/80 bg-popover py-1 text-popover-foreground shadow-card"
        >
          {results.map((p, i) => (
            <li key={p.slug} role="presentation">
              <Link
                id={`${listId}-option-${i}`}
                role="option"
                aria-selected={i === active}
                tabIndex={-1}
                href={`/product/${p.slug}`}
                className={cn(
                  "flex flex-col gap-0.5 px-3 py-2 outline-none focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                  i === active && "bg-muted"
                )}
                onMouseEnter={() => setActive(i)}
                onClick={(ev) => {
                  ev.preventDefault();
                  navigateTo(p.slug);
                }}
              >
                <span className="font-medium text-foreground">{p.name}</span>
                <span className="text-xs text-muted-foreground">
                  {p.brand} · {p.category}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
