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

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("POST", "/api/qrcodes", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/qrcodes"] });
      toast({ title: "QR Code created successfully" });
      onSuccess();
    },
    onError: (error) => {
      toast({ title: "Failed to create QR Code", description: error.message, variant: "destructive" });
    },
  });

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        form.setValue("logo", reader.result as string);
      };
      reader.readAsDataURL(file);
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
            <FormLabel>Logo</FormLabel>
            <FormControl>
              <Input type="file" accept="image/*" onChange={handleLogoChange} />
            </FormControl>
            <FormMessage />
          </FormItem>

          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            Create QR Code
          </Button>
        </form>
      </Form>
    </div>
  );
}
