"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Newspaper, Clock, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  contentSnippet?: string;
  source: string;
  id: string;
}

export function CompanyNewsCard({ symbol, companyName }: { symbol: string, companyName?: string }) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) return;
    const fetchNews = async () => {
      try {
        setLoading(true);
        // Using companyName if available for better text queries on NewsAPI, fallback to symbol
        const querySymbol = companyName || symbol;
        const res = await fetch(`/api/stocks/${encodeURIComponent(querySymbol)}/news`);
        if (!res.ok) throw new Error("Failed to fetch company news");
        const json = await res.json();

        if (json.success && Array.isArray(json.data)) {
          setNews(json.data.slice(0, 4)); // keep top 4 for the card
        } else {
          throw new Error("Invalid format from news API");
        }
      } catch (err) {
        console.error("Company news fetch error:", err);
        setError("Failed to load news for this company.");
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [symbol, companyName]);

  return (
    <div className="p-6 rounded-2xl bg-card border border-border flex flex-col h-[400px]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-blue-500" /> Recent News
        </h2>
        <a
          href={`https://niftynews.allytechcourses.com/company/${encodeURIComponent(symbol)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-blue-500 hover:text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1 group whitespace-nowrap"
        >
          View More <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </a>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-3">
        {loading ? (
          // Loading skeleton
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse flex flex-col gap-2 py-2 border-b border-border/50 last:border-0">
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/4 mt-1"></div>
            </div>
          ))
        ) : error ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center">
            <Newspaper className="w-8 h-8 opacity-20 mb-2" />
            <p className="text-sm">{error}</p>
          </div>
        ) : news.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <p className="text-sm">No recent news available.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-0 divide-y divide-border/50">
            {news.map((item) => {
              let parsedDate = "";
              try {
                if (item.pubDate) {
                  parsedDate = formatDistanceToNow(new Date(item.pubDate), { addSuffix: true });
                }
              } catch (e) {
                parsedDate = item.pubDate || "";
              }

              return (
                <a
                  key={item.id}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block py-3 hover:bg-muted/30 transition-colors -mx-2 px-2 rounded-lg"
                >
                  <h4 className="text-sm font-medium text-foreground group-hover:text-blue-400 leading-snug line-clamp-2 transition-colors">
                    {item.title}
                  </h4>

                  <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground font-medium">
                    <span className="text-blue-400/80">{item.source}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {parsedDate}
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
