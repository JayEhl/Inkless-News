import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import { DeliveryHistory } from "@/types";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Download, 
  Calendar 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HistoryPage() {
  const { data: deliveries = [], isLoading } = useQuery<DeliveryHistory[]>({
    queryKey: ["/api/delivery/history"],
  });

  const getStatusIcon = (status: string) => {
    return status === "Sent" ? (
      <CheckCircle2 className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getFormatIcon = (format: string) => {
    return (
      <div className={`p-1 rounded-md inline-flex items-center justify-center ${
        format === "pdf" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
      }`}>
        <FileText className="h-3 w-3 mr-1" />
        <span className="text-xs uppercase">{format}</span>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 p-4 md:p-8 overflow-auto">
        <header className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">Delivery History</h1>
          <p className="text-gray-600">Track your past newspaper deliveries</p>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Total Deliveries</CardTitle>
              <CardDescription>All-time</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center">
              <Calendar className="h-8 w-8 text-primary mr-4" />
              <span className="text-3xl font-bold">{deliveries.length}</span>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Successful</CardTitle>
              <CardDescription>Delivered to Kindle</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center">
              <CheckCircle2 className="h-8 w-8 text-green-500 mr-4" />
              <span className="text-3xl font-bold">
                {deliveries.filter(d => d.status === "Sent").length}
              </span>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Articles Delivered</CardTitle>
              <CardDescription>Total content</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center">
              <FileText className="h-8 w-8 text-accent mr-4" />
              <span className="text-3xl font-bold">
                {deliveries.reduce((sum, d) => sum + d.articlesCount, 0)}
              </span>
            </CardContent>
          </Card>
        </div>
        
        {isLoading ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="animate-pulse">
              <div className="bg-gray-100 h-10 mb-4"></div>
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="flex h-16 px-4 border-b border-gray-100 items-center space-x-4">
                  <div className="h-6 w-1/6 bg-gray-200 rounded"></div>
                  <div className="h-6 w-1/6 bg-gray-200 rounded"></div>
                  <div className="h-6 w-1/6 bg-gray-200 rounded"></div>
                  <div className="h-6 w-1/6 bg-gray-200 rounded"></div>
                  <div className="h-6 w-1/6 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        ) : deliveries.length > 0 ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Articles</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveries.map((delivery) => (
                  <TableRow key={delivery.id}>
                    <TableCell>
                      <div className="font-medium">{new Date(delivery.date).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(delivery.date), { addSuffix: true })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {getStatusIcon(delivery.status)}
                        <span className="ml-2">{delivery.status}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getFormatIcon(delivery.format)}</TableCell>
                    <TableCell>{delivery.articlesCount} articles</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-gray-600"
                        disabled={delivery.status !== "Sent"}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No delivery history yet</h3>
            <p className="text-gray-500 mb-6">
              Your delivery history will appear here after your first newspaper is sent
            </p>
            <Button variant="outline">
              Send a test delivery
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
