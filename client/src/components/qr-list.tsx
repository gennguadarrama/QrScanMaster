import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import QRCode from "qrcode";
import { useEffect, useRef } from "react";
import { QRCode as QRCodeType } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { BarChart3, ExternalLink, GripHorizontal } from "lucide-react";
import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface QRListProps {
  folderId?: number;
}

export default function QRList({ folderId }: QRListProps) {
  const { data: qrCodes } = useQuery<QRCodeType[]>({
    queryKey: ["/api/qrcodes"],
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const { toast } = useToast();

  const updateFolderMutation = useMutation({
    mutationFn: async ({ qrId, newFolderId }: { qrId: number; newFolderId: number | null }) => {
      const res = await apiRequest("PATCH", `/api/qrcodes/${qrId}`, { folderId: newFolderId });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/qrcodes"] });
      toast({ title: "QR movido exitosamente" });
    },
    onError: (error) => {
      toast({ 
        title: "Error al mover el QR", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const qrId = Number(active.id);
      const newFolderId = over.id === 'root' ? null : Number(over.id);

      updateFolderMutation.mutate({ qrId, newFolderId });
    }
  };

  const filteredQRCodes = folderId
    ? qrCodes?.filter((qr) => qr.folderId === folderId)
    : qrCodes;

  if (!filteredQRCodes?.length) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No hay QR codes en esta carpeta</p>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredQRCodes.map((qr) => (
          <QRCodeCard key={qr.id} qrCode={qr} />
        ))}
      </div>
    </DndContext>
  );
}

function QRCodeCard({ qrCode }: { qrCode: QRCodeType }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && qrCode.content) {
      // Create a tracking URL that will record scans
      const trackingUrl = `${window.location.origin}/api/qrcodes/${qrCode.id}/scan?content=${encodeURIComponent(qrCode.content)}`;

      const options: QRCode.QRCodeRenderersOptions = {
        width: 200,
        margin: 1,
        color: {
          dark: '#000',
          light: '#fff'
        },
      };

      // If we have a logo, add it as an image in the center of the QR code
      if (qrCode.logo) {
        const img = new Image();
        img.onload = () => {
          QRCode.toCanvas(canvasRef.current!, trackingUrl, options)
            .then(() => {
              const canvas = canvasRef.current!;
              const ctx = canvas.getContext('2d')!;

              // Calculate logo size (25% of QR code size)
              const logoSize = canvas.width * 0.25;
              const logoX = (canvas.width - logoSize) / 2;
              const logoY = (canvas.height - logoSize) / 2;

              // Create a white background for the logo
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(logoX - 2, logoY - 2, logoSize + 4, logoSize + 4);

              // Draw the logo
              ctx.drawImage(img, logoX, logoY, logoSize, logoSize);
            })
            .catch(console.error);
        };
        img.src = qrCode.logo;
      } else {
        QRCode.toCanvas(canvasRef.current, trackingUrl, options)
          .catch(console.error);
      }
    }
  }, [qrCode]);

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-primary/10" id={qrCode.id.toString()}>
      <CardContent className="p-4">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-full flex justify-end mb-2">
            <Button variant="ghost" size="icon" className="cursor-grab active:cursor-grabbing">
              <GripHorizontal className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
          <div className="bg-primary/5 rounded-lg p-3">
            <canvas ref={canvasRef} />
          </div>
          <p className="text-sm font-medium truncate w-full text-center">{qrCode.content}</p>
          <div className="flex w-full gap-2">
            <Link href={`/qr/${qrCode.id}`} className="flex-1">
              <Button className="w-full" variant="outline" size="sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                Ver Estadísticas
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => window.open(qrCode.content, '_blank')}
              className="shrink-0"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}