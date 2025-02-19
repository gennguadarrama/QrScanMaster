import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import QRCodeForm from "@/components/qr-code-form";
import FolderList from "@/components/folder-list";
import QRList from "@/components/qr-list";
import { useState } from "react";
import { Folder } from "@shared/schema";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { LogOut, Plus, QrCode, BarChart3, LayoutGrid } from "lucide-react";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-primary/5">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <QrCode className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              QR Manager
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">
              ¡Hola, <span className="font-medium text-foreground">{user?.username}</span>!
            </span>
            <Button variant="outline" size="sm" onClick={() => logoutMutation.mutate()}>
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto mb-12 text-center">
          <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            Gestiona tus códigos QR de manera profesional
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Nuestra plataforma te permite crear, organizar y analizar códigos QR con facilidad.
            Personaliza tus códigos con logos, organízalos en carpetas y obtén estadísticas detalladas de uso.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="bg-card rounded-lg p-6 border">
              <div className="flex items-center gap-2 mb-3">
                <QrCode className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Personalización</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Agrega logos personalizados a tus códigos QR para hacerlos únicos y profesionales.
              </p>
            </div>
            <div className="bg-card rounded-lg p-6 border">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Analíticas</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Monitorea el uso de tus códigos QR con estadísticas detalladas y en tiempo real.
              </p>
            </div>
            <div className="bg-card rounded-lg p-6 border">
              <div className="flex items-center gap-2 mb-3">
                <LayoutGrid className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Organización</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Mantén tus códigos QR organizados con un sistema intuitivo de carpetas.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          <div className="w-64 flex flex-col gap-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear QR Code
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <QRCodeForm onSuccess={() => {}} />
              </DialogContent>
            </Dialog>

            <div className="bg-card rounded-lg border shadow-sm p-4">
              <FolderList 
                selectedFolder={selectedFolder} 
                onSelectFolder={setSelectedFolder} 
              />
            </div>
          </div>

          <div className="flex-1 bg-card rounded-lg border shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-6">
              {selectedFolder ? `QRs en ${selectedFolder.name}` : 'Todos los QR Codes'}
            </h2>
            <QRList folderId={selectedFolder?.id} />
          </div>
        </div>
      </div>
    </div>
  );
}