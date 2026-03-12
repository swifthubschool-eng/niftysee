import { NextResponse } from "next/server";

export const revalidate = 300; // Cache for 5 mins

export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const paramsResolved = await params;
    const symbol = decodeURIComponent(paramsResolved.symbol || "");
    const apiKey = process.env.NEWS_API_KEY;

    if (!apiKey) {
      console.warn("Missing NEWS_API_KEY");
      return NextResponse.json({ success: false, data: [] }, { status: 500 });
    }

    if (!symbol) {
      return NextResponse.json({ success: false, data: [] }, { status: 400 });
    }

    const res = await fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(symbol)}&language=en&sortBy=publishedAt&pageSize=5&apiKey=${apiKey}`);

    if (!res.ok) {
      throw new Error(`News API responded with ${res.status}`);
    }

    const data = await res.json();

    // Map to be consistent with our common news schema
    const news = (data.articles || []).map((item: any) => ({
      title: item.title,
      link: item.url,
      pubDate: item.publishedAt,
      contentSnippet: item.description,
      source: item.source?.name || 'News API',
      id: item.url || item.publishedAt,
    }));

    return NextResponse.json({ success: true, data: news });
  } catch (error) {
    console.error(`Failed to fetch news for company:`, error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch news data.", data: [] },
      { status: 500 }
    );
  }
}
