import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Settings, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/sidebar";
import ArticleCard from "@/components/article-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Article, NextDelivery } from "@/types";
import Header from "@/components/Header";

export default function HomePage() {
  const { user } = useAuth();
  const [nextDelivery, setNextDelivery] = useState<NextDelivery | null>(null);
  
  const { data: articles, isLoading: articlesLoading } = useQuery<Article[]>({
    queryKey: ["/api/articles/preview"],
  });
  
  const { data: deliveryInfo } = useQuery<NextDelivery>({
    queryKey: ["/api/delivery/next"],
  });
  
  useEffect(() => {
    if (deliveryInfo) {
      setNextDelivery(deliveryInfo);
    }
  }, [deliveryInfo]);
  
  const getNextSunday = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilSunday = dayOfWeek === 0 ? 7 : 7 - dayOfWeek;
    const nextSunday = new Date(today);
    nextSunday.setDate(today.getDate() + daysUntilSunday);
    return nextSunday.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <>
      <Header />
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <header className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold">Welcome to Inkless News</h1>
            <p className="text-gray-600">
              Your personalized Sunday newspaper delivered to your Kindle
            </p>
          </header>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Next Delivery</CardTitle>
                <CardDescription>Your upcoming Sunday newspaper</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="font-medium text-primary">
                  {nextDelivery?.date || getNextSunday()}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {nextDelivery?.time || "8:00 AM"}
                </p>
                
                <div className="mt-4 text-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span>Status:</span>
                    <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs">
                      {nextDelivery?.status || "Scheduled"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Delivery to:</span>
                    <span className="truncate max-w-[180px]">
                      {nextDelivery?.email || user?.email || "Add your Kindle email"}
                    </span>
                  </div>
                </div>
                
                <div className="mt-6">
                  <Link href="/settings">
                    <Button
                      variant="outline"
                      className="w-full flex items-center justify-center"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Configure Settings
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>How It Works</CardTitle>
                <CardDescription>Your weekly personalized reading experience</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4 flex flex-col items-center text-center">
                    <div className="bg-primary/10 rounded-full p-3 mb-3">
                      <Settings className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-medium mb-1">1. Configure</h3>
                    <p className="text-sm text-gray-500">
                      Add your RSS feeds, topics of interest, and Kindle email
                    </p>
                  </div>
                  
                  <div className="border rounded-lg p-4 flex flex-col items-center text-center">
                    <div className="bg-primary/10 rounded-full p-3 mb-3">
                      <svg className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 16.5V21M18 16.5V21M6 16.5V21M12 3V12M12 12H21M12 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <h3 className="font-medium mb-1">2. AI Curation</h3>
                    <p className="text-sm text-gray-500">
                      ChatGPT selects and summarizes articles based on your interests
                    </p>
                  </div>
                  
                  <div className="border rounded-lg p-4 flex flex-col items-center text-center">
                    <div className="bg-primary/10 rounded-full p-3 mb-3">
                      <svg className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 5H3V19H21V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M3 5L12 14L21 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <h3 className="font-medium mb-1">3. Sunday Delivery</h3>
                    <p className="text-sm text-gray-500">
                      Receive your newspaper on your Kindle every Sunday morning
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-bold">Recent Articles Preview</h2>
            <Link href="/preview">
              <Button variant="ghost" className="flex items-center text-primary hover:text-primary">
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articlesLoading ? (
              Array(3).fill(0).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex justify-between mb-4">
                      <div className="h-6 w-16 bg-gray-200 rounded"></div>
                      <div className="h-6 w-24 bg-gray-200 rounded"></div>
                    </div>
                    <div className="h-6 w-full bg-gray-200 rounded mb-2"></div>
                    <div className="space-y-2 mb-4">
                      <div className="h-4 w-full bg-gray-200 rounded"></div>
                      <div className="h-4 w-full bg-gray-200 rounded"></div>
                      <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                    </div>
                    <div className="flex justify-between">
                      <div className="h-4 w-20 bg-gray-200 rounded"></div>
                      <div className="h-4 w-24 bg-gray-200 rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : articles && articles.length > 0 ? (
              articles.slice(0, 3).map((article) => (
                <ArticleCard key={article.id || article.url} article={article} />
              ))
            ) : (
              <div className="lg:col-span-3 text-center py-8">
                <p className="text-gray-500 mb-4">No articles to preview yet</p>
                <Link href="/settings">
                  <Button>Configure your feeds and topics</Button>
                </Link>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
