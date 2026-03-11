"use client";

import Image from "next/image";
import type { NewsArticle } from "@/types";

interface NewsCardProps {
  article: NewsArticle;
}

export function NewsCard({ article }: NewsCardProps) {
  const date = new Date(article.datetime * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-4 rounded-lg border border-gray-700 p-4 hover:border-gray-600 hover:bg-gray-800/50"
    >
      {article.image && (
        <Image
          src={article.image}
          alt=""
          width={80}
          height={80}
          className="h-20 w-20 flex-shrink-0 rounded-lg object-cover"
          unoptimized
        />
      )}
      <div className="min-w-0 flex-1">
        <h4 className="line-clamp-2 font-medium text-white">{article.headline}</h4>
        <p className="mt-1 line-clamp-2 text-sm text-gray-400">
          {article.summary}
        </p>
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
          <span>{article.source}</span>
          <span>{date}</span>
        </div>
      </div>
    </a>
  );
}
