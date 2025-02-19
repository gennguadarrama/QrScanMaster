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
import { Loader2, Mail, Link as LinkIcon, Phone, Type } from "lucide-react";
import { useState } from "react";

const QR_TYPES = [
  { value: 'url', label: 'URL', icon: LinkIcon },
  { value: 'text', label: 'Texto', icon: Type },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'phone', label: 'Teléfono', icon: Phone },
];

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
      // Convert folderId to number if present
      if (data.folderId) {
        data.folderId = parseInt(data.folderId as string);
      }
      const res = await apiRequest("POST", "/api/qrcodes", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/qrcodes"] });
      toast({ title: "QR Code creado exitosamente" });
      onSuccess();
      setPreviewLogo(null);
      form.reset();
    },
    onError: (error) => {
      toast({ 
        title: "Error al crear el QR Code", 
        description: error.message, 
        variant: "destructive" 
      });
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
          title: "Error al procesar el logo", 
          description: "Por favor intenta con otra imagen", 
          variant: "destructive" 
        });
        setIsProcessingLogo(false);
      }
    }
  };

  return (
    <div className="p-4">
      <DialogTitle className="text-2xl font-bold mb-2">Crear Nuevo QR Code</DialogTitle>
      <p className="text-muted-foreground mb-6">
        Personaliza tu QR code con contenido y un logo opcional
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Contenido</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {QR_TYPES.map(({ value, label, icon: Icon }) => (
                      <SelectItem key={value} value={value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {label}
                        </div>
                      </SelectItem>
                    ))}
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
                <FormLabel>Contenido</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Ingresa el contenido para tu QR code" />
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
                <FormLabel>Carpeta (Opcional)</FormLabel>
                <Select onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una carpeta" />
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
            <FormLabel>Logo (Opcional)</FormLabel>
            <div className="space-y-4">
              <div className="grid grid-cols-[1fr,auto] gap-4">
                <FormControl>
                  <Input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleLogoChange}
                    disabled={isProcessingLogo}
                  />
                </FormControl>
                {previewLogo && (
                  <div className="relative w-16 h-16 border rounded-lg overflow-hidden">
                    <img 
                      src={previewLogo} 
                      alt="Logo preview" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
              </div>
              {isProcessingLogo && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Procesando logo...
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                El logo se convertirá automáticamente a escala de grises para mejor compatibilidad
              </p>
            </div>
            <FormMessage />
          </FormItem>

          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" 
            disabled={mutation.isPending || isProcessingLogo}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando QR Code...
              </>
            ) : (
              'Crear QR Code'
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}