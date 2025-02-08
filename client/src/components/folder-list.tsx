import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Folder } from "@shared/schema";
import { Plus } from "lucide-react";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useDroppable } from "@dnd-kit/core";

interface FolderListProps {
  selectedFolder: Folder | null;
  onSelectFolder: (folder: Folder | null) => void;
}

export default function FolderList({ selectedFolder, onSelectFolder }: FolderListProps) {
  const [newFolderName, setNewFolderName] = useState("");
  const { toast } = useToast();

  const { data: folders } = useQuery({
    queryKey: ["/api/folders"],
  });

  const mutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", "/api/folders", { name });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      setNewFolderName("");
      toast({ title: "Carpeta creada exitosamente" });
    },
    onError: (error) => {
      toast({ 
        title: "Error al crear la carpeta", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      mutation.mutate(newFolderName);
    }
  };

  const { isOver: isOverRoot, setNodeRef: setRootRef } = useDroppable({
    id: 'root',
  });

  return (
    <div className="space-y-4">
      <form onSubmit={handleCreateFolder} className="flex gap-2">
        <Input
          placeholder="Nombre de la carpeta"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
        />
        <Button size="icon" disabled={mutation.isPending}>
          <Plus className="h-4 w-4" />
        </Button>
      </form>

      <div className="space-y-1">
        <div
          ref={setRootRef}
          className={cn(
            "transition-colors rounded-lg",
            isOverRoot && "ring-2 ring-primary ring-offset-2 bg-primary/10",
            !selectedFolder && "bg-accent/50"
          )}
        >
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => onSelectFolder(null)}
          >
            Todos los QR Codes
          </Button>
        </div>

        {folders?.map((folder) => (
          <FolderItem 
            key={folder.id} 
            folder={folder} 
            isSelected={selectedFolder?.id === folder.id}
            onSelect={() => onSelectFolder(folder)}
          />
        ))}
      </div>
    </div>
  );
}

function FolderItem({ 
  folder, 
  isSelected, 
  onSelect 
}: { 
  folder: Folder; 
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: folder.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "transition-all duration-200 rounded-lg",
        isOver && "ring-2 ring-primary ring-offset-2 bg-primary/10",
        isSelected && "bg-accent/50"
      )}
    >
      <Button
        variant="ghost"
        className="w-full justify-start"
        onClick={onSelect}
      >
        {folder.name}
      </Button>
    </div>
  );
}