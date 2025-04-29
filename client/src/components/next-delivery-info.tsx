import { Calendar, Send, Newspaper } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NextDelivery } from "@/types";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface NextDeliveryInfoProps {
  nextDelivery: NextDelivery;
  onSendTest: () => Promise<void>;
  onSendNow?: () => Promise<void>; // Optional to maintain backward compatibility
}

export default function NextDeliveryInfo({ 
  nextDelivery, 
  onSendTest,
  onSendNow
}: NextDeliveryInfoProps) {
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isSendingNow, setIsSendingNow] = useState(false);
  const { toast } = useToast();

  const handleSendTestDelivery = async () => {
    try {
      setIsSendingTest(true);
      await onSendTest();
      toast({
        title: "Test delivery sent",
        description: "Please check your Kindle device or app"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send test delivery",
        variant: "destructive"
      });
    } finally {
      setIsSendingTest(false);
    }
  };
  
  const handleSendNow = async () => {
    if (!onSendNow) return;
    
    try {
      setIsSendingNow(true);
      await onSendNow();
      toast({
        title: "Delivery sent",
        description: "Your articles have been sent to your Kindle device"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send delivery",
        variant: "destructive"
      });
    } finally {
      setIsSendingNow(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Scheduled":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-blue-100 text-blue-800";
      case "Sent":
        return "bg-green-100 text-green-800";
      case "Failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="mr-2 h-5 w-5 text-accent" />
          Next Delivery
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-50 p-4 rounded border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Date:</span>
            <span className="text-primary">{nextDelivery.date}</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Time:</span>
            <span className="text-primary">{nextDelivery.time}</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Status:</span>
            <span className={`px-2 py-0.5 rounded ${getStatusColor(nextDelivery.status)}`}>
              {nextDelivery.status}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">Email:</span>
            <span className="text-primary truncate max-w-[150px]">{nextDelivery.email}</span>
          </div>
        </div>
        
        <div className="mt-4 space-y-2">
          {onSendNow && (
            <Button
              variant="default"
              className="w-full flex items-center justify-center"
              onClick={handleSendNow}
              disabled={isSendingNow || isSendingTest}
            >
              <Newspaper className="mr-2 h-4 w-4" />
              {isSendingNow ? "Sending..." : "Send Now"}
            </Button>
          )}
          
          <Button
            variant="secondary"
            className="w-full flex items-center justify-center"
            onClick={handleSendTestDelivery}
            disabled={isSendingTest || isSendingNow}
          >
            <Send className="mr-2 h-4 w-4" />
            {isSendingTest ? "Sending..." : "Send Test Delivery"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
