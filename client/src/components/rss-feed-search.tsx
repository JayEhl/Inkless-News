import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface RssFeedSearchProps {
  topic: string;
  onAddFeed: (url: string) => Promise<void>;
  existingFeedUrls: Set<string>;
}

export default function RssFeedSearch({ topic, onAddFeed, existingFeedUrls }: RssFeedSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{ name: string; url: string }>>([]);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);
      const res = await apiRequest("POST", "/api/rss-feeds/search", { 
        query: searchQuery,
        topic 
      });
      
      if (!res.ok) {
        throw new Error("Failed to search for RSS feeds");
      }
      
      const results = await res.json();
      setSearchResults(results);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to search for RSS feeds",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddFeed = async (feed: { name: string; url: string }) => {
    if (existingFeedUrls.has(feed.url)) {
      toast({
        title: "Already added",
        description: `The feed "${feed.name}" is already in your list`,
        variant: "default"
      });
      return;
    }

    try {
      await onAddFeed(feed.url);
      toast({
        title: "Success",
        description: `Added ${feed.name} feed`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add feed",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Search className="mr-2 h-5 w-5 text-accent" />
          Search RSS Feeds
        </CardTitle>
        <CardDescription>
          Find RSS feeds related to {topic}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Search for RSS feeds..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button 
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
          >
            {isSearching ? "Searching..." : "Search"}
          </Button>
        </div>

        {searchResults.length > 0 && (
          <div className="space-y-2">
            {searchResults.map((feed) => (
              <div
                key={feed.url}
                className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
              >
                <div>
                  <div className="font-medium">{feed.name}</div>
                  <div className="text-xs text-gray-500 truncate max-w-[180px]">
                    {feed.url}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => handleAddFeed(feed)}
                  disabled={existingFeedUrls.has(feed.url)}
                >
                  {existingFeedUrls.has(feed.url) ? "Added" : "Add"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 