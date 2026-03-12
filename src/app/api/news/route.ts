import { NextResponse } from "next/server";

export const revalidate = 300; // Cache for 5 mins

export async function GET() {
  try {
    const apiKey = process.env.NEWS_API_KEY;

    if (!apiKey) {
      console.warn("Missing NEWS_API_KEY");
      return NextResponse.json({ success: false, data: [] }, { status: 500 });
    }

    const query = encodeURIComponent("Indian stock market OR NSE OR BSE");
    const res = await fetch(`https://newsapi.org/v2/everything?q=${query}&language=en&sortBy=publishedAt&pageSize=20&apiKey=${apiKey}`);

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
    console.error(`Failed to fetch general market news:`, error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch news data.", data: [] },
      { status: 500 }
    );
  }
}
