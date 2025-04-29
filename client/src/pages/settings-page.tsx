import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Save } from "lucide-react";
import Sidebar from "@/components/sidebar";
import RssFeedsSettings from "@/components/rss-feeds-settings";
import TopicsSettings from "@/components/topics-settings";
import KindleSettings from "@/components/kindle-settings";
import FeedSuggestions from "@/components/feed-suggestions";
import RssFeedSearch from "@/components/rss-feed-search";
import { Button } from "@/components/ui/button";
import { rssFeedMapping } from "@/lib/rss-feed-mapping";
import { RssFeed, Topic, KindleSettings as KindleSettingsType } from "@/types";
import Header from "@/components/Header";

export default function SettingsPage() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  
  // Fetch RSS feeds
  const { data: feeds = [], isLoading: feedsLoading } = useQuery<RssFeed[]>({
    queryKey: ["/api/rss-feeds"],
  });
  
  // Fetch topics
  const { data: topics = [], isLoading: topicsLoading } = useQuery<Topic[]>({
    queryKey: ["/api/topics"],
  });
  
  // Fetch Kindle settings
  const { data: kindleSettings, isLoading: kindleLoading } = useQuery<KindleSettingsType>({
    queryKey: ["/api/kindle-settings"],
  });
  
  // Add RSS feed mutation
  const addFeedMutation = useMutation({
    mutationFn: async (url: string) => {
      const res = await apiRequest("POST", "/api/rss-feeds", { url });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.details || error.message || "Failed to add RSS feed");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rss-feeds"] });
      toast({
        title: "Success",
        description: "RSS feed added successfully",
        variant: "success"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Remove RSS feed mutation
  const removeFeedMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/rss-feeds/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rss-feeds"] });
    }
  });
  
  // Add topic mutation
  const addTopicMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", "/api/topics", { name });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/topics"] });
    }
  });
  
  // Remove topic mutation
  const removeTopicMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/topics/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/topics"] });
    }
  });
  
  // Update Kindle settings mutation
  const updateKindleSettingsMutation = useMutation({
    mutationFn: async (settings: Partial<KindleSettingsType>) => {
      const res = await apiRequest("PATCH", "/api/kindle-settings", settings);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kindle-settings"] });
    }
  });
  
  // Save all settings
  const saveAllSettings = async () => {
    try {
      setSaving(true);
      await apiRequest("POST", "/api/settings/save-all");
      toast({
        title: "Settings saved",
        description: "All your settings have been saved successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  
  const getSuggestions = () => {
    if (!topics.length) return [];
    
    return topics.flatMap(topic => {
      const suggestions = rssFeedMapping[topic.name.toLowerCase()] || [];
      return suggestions.map(url => ({
        url,
        topic: topic.name
      }));
    });
  };
  
  const existingFeedUrls = new Set(feeds.map(feed => feed.url));
  
  return (
    <>
      <Header />
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <header className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
            <p className="text-gray-600">
              Configure your RSS feeds, topics, and Kindle delivery preferences
            </p>
          </header>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Settings Column */}
            <div className="lg:col-span-2 space-y-6">
              <TopicsSettings 
                topics={topics} 
                onAdd={name => addTopicMutation.mutateAsync(name)}
                onRemove={id => removeTopicMutation.mutateAsync(id)}
                isLoading={topicsLoading}
              />
              
              <RssFeedsSettings 
                feeds={feeds} 
                onAdd={url => addFeedMutation.mutateAsync(url)}
                onRemove={id => removeFeedMutation.mutateAsync(id)}
                isLoading={feedsLoading}
              />
              
              <KindleSettings 
                settings={kindleSettings || null} 
                onSave={settings => updateKindleSettingsMutation.mutateAsync(settings)}
                isLoading={kindleLoading}
              />
            </div>
            
            {/* Suggestions Column */}
            <div className="space-y-6">
              <FeedSuggestions 
                topics={topics} 
                suggestions={getSuggestions()}
                onAddFeed={url => addFeedMutation.mutateAsync(url)}
                existingFeedUrls={existingFeedUrls}
                isLoading={topicsLoading || feedsLoading}
              />
            </div>
          </div>
          
          {/* Save Settings Button */}
          <div className="mt-8 flex justify-end">
            <Button
              onClick={saveAllSettings}
              disabled={saving}
              className="flex items-center"
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save All Settings"}
            </Button>
          </div>
        </main>
      </div>
    </>
  );
}
