import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import QRCode from "qrcode";
import { useEffect, useRef } from "react";
import { QRCode as QRCodeType } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";

interface QRListProps {
  folderId?: number;
}

export default function QRList({ folderId }: QRListProps) {
  const { data: qrCodes } = useQuery<QRCodeType[]>({
    queryKey: ["/api/qrcodes"],
  });

  const filteredQRCodes = folderId
    ? qrCodes?.filter((qr) => qr.folderId === folderId)
    : qrCodes;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredQRCodes?.map((qr) => (
        <QRCodeCard key={qr.id} qrCode={qr} />
      ))}
    </div>
  );
}

function QRCodeCard({ qrCode }: { qrCode: QRCodeType }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && qrCode.content) {
      // Create a tracking URL that will record scans
      const trackingUrl = `${window.location.origin}/api/qrcodes/${qrCode.id}/scan?content=${encodeURIComponent(qrCode.content)}`;

      QRCode.toCanvas(canvasRef.current, trackingUrl, {
        width: 200,
        margin: 1,
        ...(qrCode.logo ? { 
          color: {
            dark: '#000',
            light: '#fff'
          }
        } : {}),
      }).catch(console.error);
    }
  }, [qrCode]);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-center mb-4">
          <canvas ref={canvasRef} />
        </div>
        <div className="text-center mb-4">
          <p className="font-medium truncate">{qrCode.content}</p>
          <p className="text-sm text-muted-foreground">{qrCode.type}</p>
        </div>
        <Link href={`/qr/${qrCode.id}`}>
          <Button className="w-full" variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            View Statistics
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}