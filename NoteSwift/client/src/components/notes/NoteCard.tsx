import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Edit3, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { getAuthHeader, handleAuthError } from "@/lib/authUtils";
import type { Note, UpdateNoteData } from "@shared/schema";

interface NoteCardProps {
  note: Note;
}

export function NoteCard({ note }: NoteCardProps) {
  const { toast } = useToast();
  const { token, logout } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(note.title);
  const [editContent, setEditContent] = useState(note.content);

  const deleteNoteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/notes/${note.id}`, {
        method: "DELETE",
        headers: getAuthHeader(token),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`${response.status}: ${errorData.message}`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      toast({
        title: "Note deleted",
        description: "Your note has been deleted successfully.",
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
        title: "Failed to delete note",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: async (data: UpdateNoteData) => {
      const response = await fetch(`/api/notes/${note.id}`, {
        method: "PUT",
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
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      setIsEditing(false);
      toast({
        title: "Note updated",
        description: "Your note has been updated successfully.",
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
        title: "Failed to update note",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this note?")) {
      deleteNoteMutation.mutate();
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editTitle.trim() && editContent.trim()) {
      updateNoteMutation.mutate({
        title: editTitle.trim(),
        content: editContent.trim(),
      });
    }
  };

  const handleCancel = () => {
    setEditTitle(note.title);
    setEditContent(note.content);
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInHours < 48) {
      return "Yesterday";
    } else {
      const days = Math.floor(diffInHours / 24);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  if (isEditing) {
    return (
      <Card className="note-card" data-testid={`card-note-${note.id}`}>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Note title"
              data-testid="input-edit-title"
              className="font-semibold"
            />
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Note content"
              data-testid="textarea-edit-content"
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                data-testid="button-cancel-edit"
                onClick={handleCancel}
                disabled={updateNoteMutation.isPending}
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
              <Button
                size="sm"
                data-testid="button-save-edit"
                onClick={handleSave}
                disabled={updateNoteMutation.isPending || !editTitle.trim() || !editContent.trim()}
              >
                <Save className="w-4 h-4 mr-1" />
                {updateNoteMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="note-card" data-testid={`card-note-${note.id}`}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h4 className="font-semibold text-card-foreground" data-testid="text-note-title">
            {note.title}
          </h4>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              data-testid="button-edit-note"
              onClick={handleEdit}
              className="text-muted-foreground hover:text-primary p-1 h-auto"
            >
              <Edit3 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              data-testid="button-delete-note"
              onClick={handleDelete}
              disabled={deleteNoteMutation.isPending}
              className="text-muted-foreground hover:text-destructive p-1 h-auto"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground text-sm mb-4" data-testid="text-note-content">
          {note.content}
        </p>
        <div className="text-xs text-muted-foreground" data-testid="text-note-date">
          Created {formatDate(note.createdAt?.toString() || new Date().toISOString())}
        </div>
      </CardContent>
    </Card>
  );
}
