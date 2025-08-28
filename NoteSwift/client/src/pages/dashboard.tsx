import { useQuery } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { CreateNoteForm } from "@/components/notes/CreateNoteForm";
import { NoteCard } from "@/components/notes/NoteCard";
import { getAuthHeader, handleAuthError } from "@/lib/authUtils";
import type { Note } from "@shared/schema";
import logoUrl from "@assets/logo_1756406310995.png";

export default function DashboardPage() {
  const { user, token, logout } = useAuth();
  const { toast } = useToast();

  const { data: notes = [], isLoading: notesLoading } = useQuery({
    queryKey: ["/api/notes"],
    queryFn: async () => {
      const response = await fetch("/api/notes", {
        headers: getAuthHeader(token),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`${response.status}: ${errorData.message}`);
      }

      return response.json();
    },
  });

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getFirstName = (name: string) => {
    return name.split(" ")[0];
  };

  if (!user) {
    return null; // This shouldn't happen due to auth protection, but just in case
  }

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Header Navigation */}
      <header className="bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img src={logoUrl} alt="NoteTaker Logo" className="h-8 w-auto" />
              <h1 className="text-xl font-bold text-foreground">NoteTaker</h1>
            </div>
            <div className="flex items-center gap-4">
              {/* User Info */}
              <div className="hidden sm:flex items-center gap-3">
                <div 
                  className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium"
                  data-testid="avatar-user"
                >
                  {getUserInitials(user.name)}
                </div>
                <span className="text-sm text-foreground" data-testid="text-user-name">
                  {user.name}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                data-testid="button-logout"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Welcome Section */}
      <div className="bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Welcome back, <span className="text-primary" data-testid="text-user-first-name">{getFirstName(user.name)}</span>!
            </h2>
            <p className="text-muted-foreground">Ready to capture your thoughts and ideas?</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Create Note Section */}
        <div className="mb-8">
          <CreateNoteForm />
        </div>

        {/* Notes Grid */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-foreground">Your Notes</h3>
            <span className="text-sm text-muted-foreground" data-testid="text-notes-count">
              {notes.length} note{notes.length !== 1 ? 's' : ''}
            </span>
          </div>

          {notesLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-card rounded-lg border border-border p-6 animate-pulse">
                  <div className="h-4 bg-muted rounded mb-3"></div>
                  <div className="h-16 bg-muted rounded mb-4"></div>
                  <div className="h-3 bg-muted rounded w-24"></div>
                </div>
              ))}
            </div>
          ) : notes.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-testid="notes-grid">
              {notes.map((note: Note) => (
                <NoteCard key={note.id} note={note} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16" data-testid="empty-state">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                <svg className="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No notes yet</h3>
              <p className="text-muted-foreground mb-6">Create your first note to get started with organizing your thoughts.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
