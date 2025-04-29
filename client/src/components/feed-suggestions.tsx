import { useState } from "react";
import { Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Topic, FeedSuggestion, SuggestionsMap } from "@/types";
import { useToast } from "@/hooks/use-toast";

interface FeedSuggestionsProps {
  topics: Topic[];
  suggestions: SuggestionsMap;
  onAddFeed: (url: string) => Promise<void>;
  existingFeedUrls: string[];
  isLoading?: boolean;
}

export default function FeedSuggestions({
  topics,
  suggestions,
  onAddFeed,
  existingFeedUrls,
  isLoading = false
}: FeedSuggestionsProps) {
  const [addingSuggestion, setAddingSuggestion] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAddSuggestion = async (suggestion: FeedSuggestion) => {
    if (existingFeedUrls.includes(suggestion.url)) {
      toast({
        title: "Already added",
        description: `The feed "${suggestion.name}" is already in your list`,
        variant: "default"
      });
      return;
    }
    
    try {
      setAddingSuggestion(suggestion.url);
      await onAddFeed(suggestion.url);
      toast({
        title: "Success",
        description: `Added ${suggestion.name} feed`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add feed",
        variant: "destructive"
      });
    } finally {
      setAddingSuggestion(null);
    }
  };

  // Get the active topics that have suggestions
  const activeTopics = topics
    .filter(topic => suggestions[topic.name.toLowerCase()])
    .map(topic => topic.name);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Lightbulb className="mr-2 h-5 w-5 text-accent" />
          Suggested RSS Feeds
        </CardTitle>
        <CardDescription>
          Based on your topics of interest
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="space-y-2">
                  {[1, 2].map((j) => (
                    <div key={j} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-40"></div>
                      </div>
                      <div className="h-6 bg-gray-200 rounded w-12"></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : activeTopics.length === 0 ? (
          <p className="text-center text-gray-500 py-4">
            Add topics of interest to see suggestions
          </p>
        ) : (
          <div className="space-y-6">
            {activeTopics.map((topic) => (
              <div key={topic} className="mb-6">
                <h3 className="font-semibold text-primary mb-2">{topic}</h3>
                <div className="space-y-2">
                  {suggestions[topic.toLowerCase()]?.map((suggestion) => (
                    <div
                      key={suggestion.url}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
                    >
                      <div>
                        <div className="font-medium">{suggestion.name}</div>
                        <div className="text-xs text-gray-500 truncate max-w-[180px]">
                          {suggestion.url}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="text-xs bg-primary px-2 py-1 rounded text-white hover:bg-primary-light"
                        onClick={() => handleAddSuggestion(suggestion)}
                        disabled={
                          addingSuggestion === suggestion.url || 
                          existingFeedUrls.includes(suggestion.url)
                        }
                      >
                        {existingFeedUrls.includes(suggestion.url) ? "Added" : "Add"}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
