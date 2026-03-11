"use client";

import { useEffect, useState } from "react";
import type { NewsArticle } from "@/types";
import { NewsCard } from "./NewsCard";

interface NewsFeedProps {
  ticker: string;
}

export function NewsFeed({ ticker }: NewsFeedProps) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/stocks/news/${ticker}`)
      .then((res) => res.json())
      .then((data) => setArticles(data.articles || []))
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, [ticker]);

  return (
    <div>
      <h3 className="mb-4 text-lg font-semibold text-white">Latest News</h3>
      {loading ? (
        <p className="text-gray-500">Loading news...</p>
      ) : articles.length === 0 ? (
        <p className="text-gray-500">No recent news found.</p>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
