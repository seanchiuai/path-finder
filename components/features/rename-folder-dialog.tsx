"use client";

import * as React from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface RenameFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId: Id<"folders"> | null;
  onSuccess?: () => void;
}

export function RenameFolderDialog({
  open,
  onOpenChange,
  folderId,
  onSuccess,
}: RenameFolderDialogProps) {
  const [name, setName] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const folder = useQuery(
    api.folders.getFolder,
    folderId ? { folderId } : "skip"
  );
  const updateFolder = useMutation(api.folders.updateFolder);

  // Initialize name when folder loads or folderId changes
  React.useEffect(() => {
    if (folderId && folder) {
      setName(folder.name);
    } else if (folderId && !folder) {
      // Reset to empty while loading new folder
      setName("");
    }
  }, [folder, folderId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!folderId) return;

    if (!name.trim()) {
      toast.error("Folder name cannot be empty");
      return;
    }

    if (name.length > 100) {
      toast.error("Folder name must be 100 characters or less");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateFolder({ folderId, name: name.trim() });
      toast.success("Folder renamed successfully");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to rename folder");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      onOpenChange(newOpen);
      if (!newOpen) {
        setName("");
      }
    }
  };

  const isLoading = !folder && folderId !== null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
            <DialogDescription>
              {isLoading ? "Loading folder..." : "Enter a new name for this folder."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="folder-name">Folder Name</Label>
              <Input
                id="folder-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                disabled={isSubmitting || isLoading}
                autoFocus
                placeholder={isLoading ? "Loading..." : ""}
              />
              <p className="text-xs text-muted-foreground">
                {name.length}/100 characters
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting || isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isLoading || !name.trim()}>
              {isSubmitting ? "Renaming..." : "Rename Folder"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
