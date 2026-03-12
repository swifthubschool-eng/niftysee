import { kite } from "@/lib/kite";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const interval = searchParams.get("interval") || "minute";
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const range = searchParams.get("range");

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  // ─── Timezone Fix ─────────────────────────────────────────────────────────
  // Vercel runs in UTC. NSE operates in IST (UTC+5:30).
  // Without this fix, on production "today" starts 5.5h late, missing all morning candles.
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

  const nowIST = new Date(Date.now() + IST_OFFSET_MS); // Current time in IST
  const todayIST = new Date(nowIST);
  todayIST.setUTCHours(0, 0, 0, 0); // Midnight IST (as UTC)
  const istMidnightUTC = new Date(todayIST.getTime() - IST_OFFSET_MS); // see i Convert back to real UTC

  // Calculate default dates if missing
  const toDate = to ? new Date(to) : new Date(); // current moment in UTC (is fine for "to")
  const fromDate = from ? new Date(from) : istMidnightUTC; // start of today in IST


  try {
    // Kite API: GET /instruments/historical/:instrument_token/:interval?from=...&to=...
    // The library method signature: getHistoricalData(instrument_token, interval, from_date, to_date, continuous, oi)
    const response: any = await (kite as any).getHistoricalData(
      token,
      interval,
      fromDate,
      toDate
    );

    // Response is typically an array of candles: [[date, open, high, low, close, volume], ...]
    let candles = Array.isArray(response)
      ? response
      : (response?.data?.candles || response?.candles || []);

    // ─── Holiday Fallback ────────────────────────────────────────────────────
    if (candles.length === 0 && range === "1d") {
      const fallbackFrom = new Date(fromDate);
      fallbackFrom.setDate(fallbackFrom.getDate() - 7); // Fetch up to 7 days back

      const fallbackResponse: any = await (kite as any).getHistoricalData(
        token,
        interval,
        fallbackFrom,
        toDate
      );

      const fallbackCandles = Array.isArray(fallbackResponse)
        ? fallbackResponse
        : (fallbackResponse?.data?.candles || fallbackResponse?.candles || []);

      if (fallbackCandles.length > 0) {
        const lastCandleStr = fallbackCandles[fallbackCandles.length - 1][0];
        const lastDatePrefix = lastCandleStr.split("T")[0]; // "YYYY-MM-DD"
        candles = fallbackCandles.filter((c: any) => c[0].startsWith(lastDatePrefix));
        console.log(`[Proxy] Empty 1d requested. Falling back to previous trading session: ${lastDatePrefix}`);
      }
    }

    if (!Array.isArray(candles)) {
      return NextResponse.json({ status: "error", message: "Invalid data format from Zerodha" }, { status: 502 });
    }

    return NextResponse.json({ status: "ok", data: candles });
  } catch (error: any) {
    console.error(`Error proxying historical data for token ${token}:`, error.message);
    return NextResponse.json(
      { error: "Failed to fetch historical data", details: error.message },
      { status: 500 }
    );
  }
}
