import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { QRCode } from "qrcode";
import { useEffect, useRef } from "react";

interface QRListProps {
  folderId?: number;
}

export default function QRList({ folderId }: QRListProps) {
  const { data: qrCodes } = useQuery({
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

function QRCodeCard({ qrCode }: { qrCode: any }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, qrCode.content, {
        width: 200,
        margin: 1,
        ...(qrCode.logo ? { logo: qrCode.logo } : {}),
      });
    }
  }, [qrCode]);

  return (
    <Link href={`/qr/${qrCode.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardContent className="p-6">
          <div className="flex justify-center mb-4">
            <canvas ref={canvasRef} />
          </div>
          <div className="text-center">
            <p className="font-medium truncate">{qrCode.content}</p>
            <p className="text-sm text-muted-foreground">{qrCode.type}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
