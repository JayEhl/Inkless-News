import { useState } from "react";
import { Tag, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Topic } from "@/types";
import { useToast } from "@/hooks/use-toast";

interface TopicsSettingsProps {
  topics: Topic[];
  onAdd: (name: string) => Promise<void>;
  onRemove: (id: number) => Promise<void>;
  isLoading?: boolean;
}

export default function TopicsSettings({
  topics,
  onAdd,
  onRemove,
  isLoading = false
}: TopicsSettingsProps) {
  const [newTopic, setNewTopic] = useState("");
  const [addingTopic, setAddingTopic] = useState(false);
  const { toast } = useToast();

  const handleAddTopic = async () => {
    if (!newTopic) {
      toast({
        title: "Error",
        description: "Please enter a topic",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setAddingTopic(true);
      const topicsList = newTopic
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);
      
      for (const topic of topicsList) {
        await onAdd(topic);
      }
      
      setNewTopic("");
      toast({
        title: "Success",
        description: topicsList.length > 1 
          ? `${topicsList.length} topics added successfully` 
          : "Topic added successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add topic",
        variant: "destructive"
      });
    } finally {
      setAddingTopic(false);
    }
  };

  const handleRemoveTopic = async (id: number) => {
    try {
      await onRemove(id);
      toast({
        title: "Success",
        description: "Topic removed successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove topic",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Tag className="mr-2 h-5 w-5 text-accent" />
          Topics of Interest
        </CardTitle>
        <CardDescription>
          Select topics you're interested in to help curate your news
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex space-x-2">
            <Input
              type="text"
              placeholder="technology, sports, politics"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
            />
            <Button 
              className="bg-accent hover:bg-accent/90" 
              onClick={handleAddTopic}
              disabled={addingTopic || isLoading}
            >
              Add Topic
            </Button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3].map((i) => (
              <div 
                key={i} 
                className="px-3 py-1 bg-primary animate-pulse text-white rounded-full h-8 w-20"
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {topics.length === 0 ? (
              <p className="text-center text-gray-500 py-4 w-full">No topics added yet</p>
            ) : (
              topics.map((topic) => (
                <div
                  key={topic.id}
                  className="px-3 py-1 bg-primary text-white rounded-full flex items-center"
                >
                  <span>{topic.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2 text-white/80 hover:text-white h-4 w-4 p-0"
                    onClick={() => handleRemoveTopic(topic.id)}
                  >
                    <X className="h-3 w-3" />
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
