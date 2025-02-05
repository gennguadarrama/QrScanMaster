import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import AnalyticsCard from "@/components/analytics-card";
import QRCode from "qrcode";
import { useEffect, useRef } from "react";
import { QRCode as QRCodeType, Scan } from "@shared/schema";

export default function QRDetails() {
  const { id } = useParams();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { data: qrCode } = useQuery<QRCodeType>({
    queryKey: [`/api/qrcodes/${id}`],
  });

  const { data: scans } = useQuery<Scan[]>({
    queryKey: [`/api/qrcodes/${id}/scans`],
  });

  useEffect(() => {
    if (qrCode?.content && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, qrCode.content, {
        width: 300,
        margin: 2,
        ...(qrCode.logo ? {
          color: {
            dark: '#000',
            light: '#fff'
          }
        } : {}),
      }).catch(console.error);
    }
  }, [qrCode]);

  if (!qrCode) return null;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto">
        <Link href="/">
          <Button variant="outline" className="mb-8">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">QR Code Preview</h2>
            <div className="flex justify-center">
              <canvas ref={canvasRef} />
            </div>
            <div className="mt-4 text-center">
              <p className="text-muted-foreground mb-2">Content: {qrCode.content}</p>
              <p className="text-muted-foreground">Type: {qrCode.type}</p>
            </div>
          </Card>

          <AnalyticsCard scans={scans || []} />
        </div>
      </div>
    </div>
  );
}