import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Folder } from "@shared/schema";
import { Plus } from "lucide-react";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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
      toast({ title: "Folder created successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to create folder", description: error.message, variant: "destructive" });
    },
  });

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      mutation.mutate(newFolderName);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleCreateFolder} className="flex gap-2">
        <Input
          placeholder="New folder name"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
        />
        <Button size="icon" disabled={mutation.isPending}>
          <Plus className="h-4 w-4" />
        </Button>
      </form>

      <div className="space-y-1">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start",
            !selectedFolder && "bg-accent"
          )}
          onClick={() => onSelectFolder(null)}
        >
          All QR Codes
        </Button>
        
        {folders?.map((folder) => (
          <Button
            key={folder.id}
            variant="ghost"
            className={cn(
              "w-full justify-start",
              selectedFolder?.id === folder.id && "bg-accent"
            )}
            onClick={() => onSelectFolder(folder)}
          >
            {folder.name}
          </Button>
        ))}
      </div>
    </div>
  );
}
