"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { VolumePriceGraph } from "@/components/stock/VolumePriceGraph";
import { RangeValue } from "@/components/terminal/RangeSelector";

export default function VolumeAnalysisPage() {
  const [query, setQuery] = useState("");
  const [activeSymbol, setActiveSymbol] = useState("RELIANCE");
  const [range, setRange] = useState<RangeValue>("3m");
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Search logic
  useEffect(() => {
    if (!query) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await fetch(`/api/stocks/search?q=${query}`);
        const data = await res.json();
        if (data.success) {
          setSearchResults(data.data.slice(0, 5));
        }
      } catch (err) {
        console.error("Search error", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Fetch Chart Data
  useEffect(() => {
    if (!activeSymbol) return;

    let apiInterval = "day";
    const to = new Date();
    const from = new Date();

    switch (range) {
      case "1d":
        from.setDate(from.getDate() - 2);
        apiInterval = "minute";
        break;
      case "5d":
        from.setDate(from.getDate() - 7);
        apiInterval = "5minute";
        break;
      case "1m":
        from.setMonth(from.getMonth() - 1);
        apiInterval = "60minute";
        break;
      case "3m":
        from.setMonth(from.getMonth() - 3);
        apiInterval = "day";
        break;
      case "1y":
        from.setFullYear(from.getFullYear() - 1);
        apiInterval = "day";
        break;
      case "5y":
        from.setFullYear(from.getFullYear() - 5);
        apiInterval = "day";
        break;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        // We first need the instrument token for the symbol
        // For simplicity, we can reuse the historical api if we fetch token first, or build a unified endpoint
        // Let's use the search API to grab the instrument token quickly
        const tokenRes = await fetch(`/api/stocks/search?q=${activeSymbol}`);
        const tokenData = await tokenRes.json();

        let token = 738561; // Reliance fallback
        if (tokenData.success && tokenData.data.length > 0) {
          const match = tokenData.data.find((s: any) => s.symbol === activeSymbol) || tokenData.data[0];
          token = match.instrument_token;
        }

        const histRes = await fetch(`/api/stocks/history?token=${token}&interval=${apiInterval}&from=${from.toISOString()}&to=${to.toISOString()}&range=${range}`);
        const histData = await histRes.json();

        if (histData.status === "ok" && Array.isArray(histData.data)) {
          // Format it for recharts
          const formatted = histData.data.map((c: any) => {
            const d = new Date(c[0] || c.date);
            // Keep formatting simple based on range
            let timeLabel = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
            if (range === '1d' || range === '5d') {
              timeLabel = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
            } else if (range === '5y') {
              timeLabel = d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
            }

            return {
              time: timeLabel,
              timestamp: d.getTime(), // raw for sorting / uniqueness if needed
              price: c[4] || c.close,
              volume: c[5] || c.volume || 0,
            };
          });
          setChartData(formatted);
        } else {
          setChartData([]);
        }

      } catch (err) {
        console.error("Data fetch error", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [activeSymbol, range]);

  const handleSelectStock = (symbol: string) => {
    setActiveSymbol(symbol);
    setQuery("");
    setSearchResults([]);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <DashboardNavbar />
      <div className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Volume Analysis</h1>
          <p className="text-muted-foreground">Compare trading volume patterns against price changes to identify trends and breakouts.</p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-8 z-10">
          <div className="relative flex items-center w-full md:w-96">
            <Search className="absolute left-3 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search explicitly for any stock (e.g. TCS, INFY)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 h-12 rounded-xl text-base bg-card border-border shadow-sm focus-visible:ring-primary"
            />
          </div>

          {/* Search Dropdown */}
          {query.length > 0 && (
            <div className="absolute top-full left-0 mt-2 w-full md:w-96 bg-card border border-border rounded-xl shadow-lg overflow-hidden flex flex-col z-50">
              {isSearching ? (
                <div className="p-4 text-center text-muted-foreground text-sm">Searching...</div>
              ) : searchResults.length > 0 ? (
                searchResults.map((result) => (
                  <button
                    key={result.symbol}
                    onClick={() => handleSelectStock(result.symbol)}
                    className="flex justify-between items-center px-4 py-3 hover:bg-muted text-left transition-colors border-b last:border-0 border-border"
                  >
                    <div>
                      <div className="font-semibold text-foreground">{result.symbol}</div>
                      <div className="text-xs text-muted-foreground">{result.name}</div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-muted-foreground text-sm">No stocks found matching "{query}"</div>
              )}
            </div>
          )}
        </div>

        {/* Graph Area */}
        <VolumePriceGraph
          symbol={activeSymbol}
          data={chartData}
          isLoading={isLoading}
          range={range}
          onRangeChange={setRange}
        />
      </div>
    </div>
  );
}
