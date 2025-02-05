import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { insertQRCodeSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export default function QRCodeForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const form = useForm({
    resolver: zodResolver(insertQRCodeSchema),
    defaultValues: {
      content: "",
      type: "url",
      logo: undefined,
      folderId: undefined,
    },
  });

  const { data: folders } = useQuery({
    queryKey: ["/api/folders"],
  });

  const [previewLogo, setPreviewLogo] = useState<string | null>(null);
  const [isProcessingLogo, setIsProcessingLogo] = useState(false);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("POST", "/api/qrcodes", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/qrcodes"] });
      toast({ title: "QR Code created successfully" });
      onSuccess();
      setPreviewLogo(null);
    },
    onError: (error) => {
      toast({ title: "Failed to create QR Code", description: error.message, variant: "destructive" });
    },
  });

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessingLogo(true);
      try {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          setPreviewLogo(base64);
          form.setValue("logo", base64);
          setIsProcessingLogo(false);
        };
        reader.readAsDataURL(file);
      } catch (error) {
        toast({ 
          title: "Error processing logo", 
          description: "Please try a different image file", 
          variant: "destructive" 
        });
        setIsProcessingLogo(false);
      }
    }
  };

  return (
    <div className="p-4">
      <DialogTitle className="text-2xl font-bold mb-6">Create New QR Code</DialogTitle>
      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="url">URL</SelectItem>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Content</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="folderId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Folder</FormLabel>
                <Select onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select folder" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {folders?.map((folder) => (
                      <SelectItem key={folder.id} value={folder.id.toString()}>
                        {folder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormItem>
            <FormLabel>Logo (Optional)</FormLabel>
            <div className="space-y-4">
              <FormControl>
                <Input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleLogoChange}
                  disabled={isProcessingLogo}
                />
              </FormControl>
              {isProcessingLogo && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing logo...
                </div>
              )}
              {previewLogo && (
                <div className="relative w-20 h-20">
                  <img 
                    src={previewLogo} 
                    alt="Logo preview" 
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                The logo will be automatically converted to grayscale for better QR code compatibility
              </p>
            </div>
            <FormMessage />
          </FormItem>

          <Button type="submit" className="w-full" disabled={mutation.isPending || isProcessingLogo}>
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating QR Code...
              </>
            ) : (
              'Create QR Code'
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}