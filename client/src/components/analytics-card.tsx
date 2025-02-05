import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scan } from "@shared/schema";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

interface AnalyticsCardProps {
  scans: Scan[];
}

export default function AnalyticsCard({ scans }: AnalyticsCardProps) {
  // Group scans by date
  const scansByDate = scans.reduce((acc, scan) => {
    const date = format(new Date(scan.timestamp), "MM/dd");
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(scansByDate).map(([date, count]) => ({
    date,
    scans: count,
  }));

  // Calculate device distribution
  const deviceStats = scans.reduce((acc, scan) => {
    if (scan.device) {
      acc[scan.device] = (acc[scan.device] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-medium mb-4">Scan History</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="scans" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">Device Distribution</h3>
            <div className="space-y-2">
              {Object.entries(deviceStats).map(([device, count]) => (
                <div key={device} className="flex justify-between">
                  <span className="text-muted-foreground">{device}</span>
                  <span className="font-medium">{count} scans</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">Quick Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-primary/5 p-4 rounded-lg">
                <div className="text-3xl font-bold">{scans.length}</div>
                <div className="text-sm text-muted-foreground">Total Scans</div>
              </div>
              <div className="bg-primary/5 p-4 rounded-lg">
                <div className="text-3xl font-bold">
                  {format(new Date(scans[scans.length - 1]?.timestamp || new Date()), "MM/dd/yy")}
                </div>
                <div className="text-sm text-muted-foreground">Last Scan</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
