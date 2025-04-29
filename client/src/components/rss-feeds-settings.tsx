import { useState } from "react";
import { Rss, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RssFeed } from "@/types";
import { useToast } from "@/hooks/use-toast";

interface RssFeedsSettingsProps {
  feeds: RssFeed[];
  onAdd: (url: string) => Promise<void>;
  onRemove: (id: number) => Promise<void>;
  isLoading?: boolean;
}

export default function RssFeedsSettings({
  feeds,
  onAdd,
  onRemove,
  isLoading = false
}: RssFeedsSettingsProps) {
  const [newFeedUrl, setNewFeedUrl] = useState("");
  const [addingFeed, setAddingFeed] = useState(false);
  const { toast } = useToast();

  const handleAddFeed = async () => {
    if (!newFeedUrl) {
      toast({
        title: "Error",
        description: "Please enter a valid RSS feed URL",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setAddingFeed(true);
      await onAdd(newFeedUrl);
      setNewFeedUrl("");
      toast({
        title: "Success",
        description: "RSS feed added successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add RSS feed",
        variant: "destructive"
      });
    } finally {
      setAddingFeed(false);
    }
  };

  const handleRemoveFeed = async (id: number) => {
    try {
      await onRemove(id);
      toast({
        title: "Success",
        description: "RSS feed removed successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove RSS feed",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Rss className="mr-2 h-5 w-5 text-accent" />
          RSS Feeds
        </CardTitle>
        <CardDescription>
          Add RSS feed URLs that you want to include in your Sunday newspaper
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex space-x-2">
            <Input
              type="text"
              placeholder="https://example.com/feed.xml"
              value={newFeedUrl}
              onChange={(e) => setNewFeedUrl(e.target.value)}
            />
            <Button 
              className="bg-accent hover:bg-accent/90" 
              onClick={handleAddFeed}
              disabled={addingFeed || isLoading}
            >
              Add Feed
            </Button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div 
                key={i} 
                className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200 animate-pulse"
              >
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="h-4 bg-gray-200 rounded w-6"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {feeds.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No RSS feeds added yet</p>
            ) : (
              feeds.map((feed) => (
                <div
                  key={feed.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200"
                >
                  <div className="flex items-center truncate">
                    <Rss className="text-accent mr-2 h-4 w-4" />
                    <span className="truncate">{feed.url}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-500 hover:text-destructive"
                    onClick={() => handleRemoveFeed(feed.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
