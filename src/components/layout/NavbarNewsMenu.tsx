"use client";

import { useState, useEffect } from "react";
import { Newspaper, ChevronDown, Clock, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  id: string;
}

export function NavbarNewsMenu() {
  const [open, setOpen] = useState(false);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchNews = async () => {
    if (hasFetched) return;
    try {
      setLoading(true);
      const res = await fetch("/api/news");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setNews(json.data.slice(0, 5)); // Keep only top 5 for the navbar dropdown
        setHasFetched(true);
      }
    } catch (err) {
      console.error("News fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchNews();
    }
  }, [open, hasFetched]);

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors outline-none data-[state=open]:bg-accent data-[state=open]:text-foreground">
          <Newspaper className="h-4 w-4" />
          News
          <ChevronDown className="h-3 w-3 opacity-50" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={8}
          className="z-50 w-80 md:w-96 rounded-xl border border-border bg-card p-2 text-foreground shadow-2xl animate-in fade-in-0 zoom-in-95"
        >
          <div className="px-3 py-2 border-b border-border mb-2 flex justify-between items-center">
            <span className="font-semibold text-sm flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-blue-500" /> Latest Updates
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-sm">Live</span>
          </div>

          <div className="flex flex-col gap-1 max-h-[350px] overflow-y-auto pr-1">
            {loading ? (
              <div className="p-4 flex justify-center text-muted-foreground">
                <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
            ) : news.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">No news available</div>
            ) : (
              news.map((item) => {
                let parsedDate = "";
                try {
                  if (item.pubDate) {
                    parsedDate = formatDistanceToNow(new Date(item.pubDate), { addSuffix: true });
                  }
                } catch (e) {
                  parsedDate = item.pubDate;
                }

                return (
                  <DropdownMenu.Item key={item.id} asChild>
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col gap-1.5 px-3 py-2.5 rounded-lg outline-none hover:bg-muted/50 cursor-pointer transition-colors group"
                    >
                      <h4 className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-blue-400 transition-colors">
                        {item.title}
                      </h4>
                      <div className="flex justify-between items-center mt-1">
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium">
                          <span className="text-blue-400/80">{item.source}</span>
                          <span className="flex items-center gap-1 opacity-70">
                            <Clock className="w-3 h-3" />
                            {parsedDate}
                          </span>
                        </div>
                        <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </a>
                  </DropdownMenu.Item>
                );
              })
            )}
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
