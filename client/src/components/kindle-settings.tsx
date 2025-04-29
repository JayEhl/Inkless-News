import { useState, useEffect } from "react";
import { Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { KindleSettings as KindleSettingsType } from "@/types";
import { useToast } from "@/hooks/use-toast";

interface KindleSettingsProps {
  settings: KindleSettingsType | null;
  onSave: (settings: Partial<KindleSettingsType>) => Promise<void>;
  isLoading?: boolean;
}

export default function KindleSettings({ 
  settings, 
  onSave,
  isLoading = false
}: KindleSettingsProps) {
  const [email, setEmail] = useState("");
  const [active, setActive] = useState(true);
  const [deliveryTime, setDeliveryTime] = useState(8);
  const [format, setFormat] = useState<"pdf" | "mobi" | "epub">("pdf");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (settings) {
      setEmail(settings.email || "");
      setActive(settings.active);
      setDeliveryTime(settings.deliveryTime);
      setFormat(settings.format);
    }
  }, [settings]);

  const handleChange = async (field: keyof KindleSettingsType, value: any) => {
    try {
      setSaving(true);
      await onSave({ [field]: value });
      toast({
        title: "Success",
        description: "Kindle setting updated successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update setting",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEmailBlur = async () => {
    if (email !== settings?.email) {
      await handleChange('email', email);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Mail className="mr-2 h-5 w-5 text-accent" />
          Kindle Delivery
        </CardTitle>
        <CardDescription>
          Set up your Kindle email for Sunday morning delivery
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="kindle-email" className="text-sm font-medium text-gray-700 mb-1">
              Kindle Email Address
            </Label>
            <Input
              id="kindle-email"
              type="email"
              placeholder="your-kindle@kindle.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={handleEmailBlur}
              disabled={isLoading || saving}
            />
          </div>
          
          <div>
            <div className="flex items-center space-x-2">
              <Switch
                id="kindle-active"
                checked={active}
                onCheckedChange={(checked) => handleChange('active', checked)}
                disabled={isLoading || saving}
              />
              <Label htmlFor="kindle-active">Enable automatic Sunday delivery</Label>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center">
              <Label htmlFor="delivery-time" className="text-sm font-medium text-gray-700">
                Delivery Time
              </Label>
              <span className="text-sm text-gray-500">{deliveryTime}:00 AM</span>
            </div>
            <Slider
              id="delivery-time"
              min={5}
              max={12}
              step={1}
              value={[deliveryTime]}
              onValueChange={(value) => setDeliveryTime(value[0])}
              onValueCommit={(value) => handleChange('deliveryTime', value[0])}
              disabled={isLoading || saving}
              className="mt-2"
            />
          </div>
          
          <div>
            <Label htmlFor="format" className="text-sm font-medium text-gray-700 mb-1">
              Format
            </Label>
            <RadioGroup
              id="format"
              value={format}
              onValueChange={(value: "pdf" | "mobi" | "epub") => handleChange('format', value)}
              className="flex space-x-4"
              disabled={isLoading || saving}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf">PDF</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mobi" id="mobi" />
                <Label htmlFor="mobi">MOBI</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="epub" id="epub" />
                <Label htmlFor="epub">EPUB</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
