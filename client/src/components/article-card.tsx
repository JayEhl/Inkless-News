import { Card, CardContent } from "@/components/ui/card";
import { Article } from "@/types";
import { Newspaper, ExternalLink, User, Copyright } from "lucide-react";

interface ArticleCardProps {
  article: Article;
}

export default function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Card className="article-card overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="bg-primary text-white text-xs px-2 py-1 rounded">
            {article.category}
          </span>
          <span className="text-xs text-gray-500">{article.date}</span>
        </div>
        
        <h3 className="font-bold text-lg mb-2">{article.title}</h3>
        
        <div className="text-gray-600 text-sm mb-4">
          {article.isTruncated ? (
            <div>
              <p className="italic">{article.summary}</p>
              <p className="text-accent mt-2">This is a preview. Click to read the full article.</p>
            </div>
          ) : (
            <p>{article.summary}</p>
          )}
        </div>
        
        <div className="flex flex-col gap-2 mb-4">
          {article.author && (
            <div className="text-xs text-gray-500 flex items-center">
              <User className="mr-1 h-3 w-3" />
              <span>By {article.author}</span>
            </div>
          )}
          {article.copyright && (
            <div className="text-xs text-gray-500 flex items-center">
              <Copyright className="mr-1 h-3 w-3" />
              <span>{article.copyright}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 flex items-center">
            <Newspaper className="mr-1 h-3 w-3" />
            <span>{article.source}</span>
          </span>
          <a 
            href={article.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-accent text-sm hover:underline flex items-center"
          >
            {article.isTruncated ? "Read full article" : "Read original"}
            <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
