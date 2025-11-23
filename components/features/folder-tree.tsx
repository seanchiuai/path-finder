"use client";

import * as React from "react";
import { IconPlus, IconFolderPlus } from "@tabler/icons-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { FolderTreeItem } from "./folder-tree-item";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// Match the FolderNode type from convex/folders.ts - not used currently
// interface FolderNode extends Doc<"folders"> {
//   children: FolderNode[];
//   bookmarkCount: number;
// }

interface FolderTreeProps {
  projectId: Id<"projects">;
  selectedFolderId?: Id<"folders">;
  onSelectFolder: (folderId: Id<"folders">) => void;
  onNewFolder: (parentFolderId?: Id<"folders">) => void;
  onRenameFolder: (folderId: Id<"folders">) => void;
}

export function FolderTree({
  projectId,
  selectedFolderId,
  onSelectFolder,
  onNewFolder,
  onRenameFolder,
}: FolderTreeProps) {
  const folders = useQuery(api.folders.listFoldersInProject, { projectId });

  if (folders === undefined) {
    return (
      <div className="space-y-2 p-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  if (folders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <IconFolderPlus className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-sm font-medium mb-2">No folders yet</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Create your first folder to organize your bookmarks
        </p>
        <Button onClick={() => onNewFolder()} size="sm">
          <IconPlus className="mr-2 h-4 w-4" />
          Create Folder
        </Button>
      </div>
    );
  }

  return (
    <div className="py-2">
      <div className="flex items-center justify-between px-2 mb-2">
        <h3 className="text-sm font-medium text-muted-foreground">Folders</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNewFolder()}
          className="h-7 px-2"
        >
          <IconPlus className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-0.5">
        {folders.map((folder) => (
          <FolderTreeItem
            key={folder._id}
            folder={folder}
            level={0}
            selectedFolderId={selectedFolderId}
            onSelect={onSelectFolder}
            onNewSubfolder={(parentFolderId) => onNewFolder(parentFolderId)}
            onRename={onRenameFolder}
          />
        ))}
      </div>
    </div>
  );
}
