import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import QRCode from "qrcode";
import { useEffect, useRef } from "react";
import { QRCode as QRCodeType } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { BarChart3, ExternalLink, GripHorizontal, Download } from "lucide-react";
import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { jsPDF } from "jspdf";

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
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: qrCode.id.toString(),
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 1,
  } : undefined;

  const handleDownloadPDF = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Add title
    pdf.setFontSize(16);
    pdf.text("QR Code", 105, 20, { align: "center" });

    // Add content description
    pdf.setFontSize(12);
    pdf.text(`Contenido: ${qrCode.content}`, 20, 40);
    pdf.text(`Tipo: ${qrCode.type}`, 20, 50);

    // Add QR code image
    const imgData = canvas.toDataURL("image/png");
    const imgWidth = 100;
    const imgHeight = 100;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const x = (pageWidth - imgWidth) / 2;
    pdf.addImage(imgData, "PNG", x, 70, imgWidth, imgHeight);

    // Download the PDF
    pdf.save(`qr-code-${qrCode.id}.pdf`);
  };

  useEffect(() => {
    if (canvasRef.current && qrCode.content) {
      const trackingUrl = `${window.location.origin}/api/qrcodes/${qrCode.id}/scan?content=${encodeURIComponent(qrCode.content)}`;

      const options: QRCode.QRCodeRenderersOptions = {
        width: 200,
        margin: 1,
        color: {
          dark: '#000',
          light: '#fff'
        },
      };

      if (qrCode.logo) {
        const img = new Image();
        img.onload = () => {
          QRCode.toCanvas(canvasRef.current!, trackingUrl, options)
            .then(() => {
              const canvas = canvasRef.current!;
              const ctx = canvas.getContext('2d')!;

              const logoSize = canvas.width * 0.25;
              const logoX = (canvas.width - logoSize) / 2;
              const logoY = (canvas.height - logoSize) / 2;

              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(logoX - 2, logoY - 2, logoSize + 4, logoSize + 4);

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
    <div ref={setNodeRef} style={style}>
      <Card 
        className={cn(
          "group transition-all duration-300 border-primary/10",
          "hover:shadow-lg touch-none cursor-grab active:cursor-grabbing",
          isDragging && "shadow-2xl rotate-2 scale-105"
        )}
        {...attributes}
        {...listeners}
      >
        <CardContent className="p-4">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-full flex justify-end mb-2">
              <GripHorizontal className="h-4 w-4 text-muted-foreground" />
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
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleDownloadPDF}
                className="shrink-0"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}