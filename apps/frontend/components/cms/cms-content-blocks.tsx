import type { CmsContentBlock } from "@/lib/server/cms";
import Image from "next/image";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CmsContentBlocks({ blocks }: { blocks: CmsContentBlock[] }) {
  if (!blocks.length) return null;

  return (
    <div className="space-y-10 mt-12">
      {blocks.map((block) => {
        if (block.type === "image" && block.imageUrl) {
          return (
            <div key={block.id} className="relative aspect-[21/9] overflow-hidden rounded-xl">
              <Image src={block.imageUrl} alt={block.title ?? ""} fill className="object-cover" />
            </div>
          );
        }
        if (block.type === "cta" && block.ctaHref) {
          return (
            <div key={block.id}>
              <Link href={block.ctaHref} className={cn(buttonVariants({ variant: "outline" }))}>
                {block.ctaLabel ?? "Learn more"}
              </Link>
            </div>
          );
        }
        if (block.type === "html" && block.body) {
          return (
            <div
              key={block.id}
              className="prose prose-stone max-w-none"
              dangerouslySetInnerHTML={{ __html: block.body }}
            />
          );
        }
        return (
          <div key={block.id} className="space-y-2">
            {block.title ? (
              <h3 className="font-heading text-xl tracking-tight">{block.title}</h3>
            ) : null}
            {block.body ? (
              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {block.body}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
