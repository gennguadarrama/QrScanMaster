import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import QRCodeForm from "@/components/qr-code-form";
import FolderList from "@/components/folder-list";
import QRList from "@/components/qr-list";
import { useState } from "react";
import { Folder } from "@shared/schema";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { LogOut, Plus } from "lucide-react";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">QR Manager</h1>
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">Welcome, {user?.username}</span>
            <Button variant="outline" size="sm" onClick={() => logoutMutation.mutate()}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          <div className="w-64 flex flex-col gap-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Create QR Code
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <QRCodeForm onSuccess={() => {}} />
              </DialogContent>
            </Dialog>

            <FolderList 
              selectedFolder={selectedFolder} 
              onSelectFolder={setSelectedFolder} 
            />
          </div>

          <div className="flex-1">
            <QRList folderId={selectedFolder?.id} />
          </div>
        </div>
      </main>
    </div>
  );
}
