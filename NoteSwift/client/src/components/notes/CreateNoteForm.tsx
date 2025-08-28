import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { createNoteSchema, type CreateNoteData } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { getAuthHeader, handleAuthError } from "@/lib/authUtils";

export function CreateNoteForm() {
  const { toast } = useToast();
  const { token, logout } = useAuth();
  const queryClient = useQueryClient();

  const form = useForm<CreateNoteData>({
    resolver: zodResolver(createNoteSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });

  const createNoteMutation = useMutation({
    mutationFn: async (data: CreateNoteData) => {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(token),
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`${response.status}: ${errorData.message}`);
      }

      return response.json();
    },
    onSuccess: () => {
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      toast({
        title: "Note created",
        description: "Your note has been saved successfully.",
      });
    },
    onError: (error: any) => {
      if (handleAuthError(error, logout)) {
        toast({
          title: "Session expired",
          description: "Please log in again to continue.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Failed to create note",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateNoteData) => {
    createNoteMutation.mutate(data);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-card-foreground mb-4">Create New Note</h3>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="title" className="sr-only">Note title</Label>
            <Input
              id="title"
              data-testid="input-note-title"
              placeholder="Note title..."
              {...form.register("title")}
              className="w-full"
            />
            {form.formState.errors.title && (
              <div className="error-message" data-testid="text-title-error">
                {form.formState.errors.title.message}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="content" className="sr-only">Note content</Label>
            <Textarea
              id="content"
              data-testid="textarea-note-content"
              rows={4}
              placeholder="Write your note here..."
              {...form.register("content")}
              className="w-full resize-none"
            />
            {form.formState.errors.content && (
              <div className="error-message" data-testid="text-content-error">
                {form.formState.errors.content.message}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              data-testid="button-save-note"
              disabled={createNoteMutation.isPending}
              className="btn-primary"
            >
              {createNoteMutation.isPending ? "Saving..." : "Save Note"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
