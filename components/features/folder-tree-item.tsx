"use client";

import * as React from "react";
import {
  IconFolder,
  IconFolderOpen,
  IconChevronRight,
  IconChevronDown,
  IconPlus,
  IconEdit,
  IconTrash,
} from "@tabler/icons-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FolderNode extends Doc<"folders"> {
  children: FolderNode[];
  bookmarkCount: number;
}

interface FolderTreeItemProps {
  folder: FolderNode;
  level: number;
  selectedFolderId?: Id<"folders">;
  onSelect: (folderId: Id<"folders">) => void;
  onNewSubfolder: (parentFolderId: Id<"folders">) => void;
  onRename: (folderId: Id<"folders">) => void;
}

const MAX_FOLDER_DEPTH = 5;

export function FolderTreeItem({
  folder,
  level,
  selectedFolderId,
  onSelect,
  onNewSubfolder,
  onRename,
}: FolderTreeItemProps) {
  const [isExpanded, setIsExpanded] = React.useState(level === 0);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const deleteFolder = useMutation(api.folders.deleteFolder);

  const isSelected = selectedFolderId === folder._id;
  const hasChildren = folder.children.length > 0;
  const isMaxDepth = level >= MAX_FOLDER_DEPTH - 1;

  const handleDelete = async () => {
    if (!confirm(
      `Delete "${folder.name}"? This will delete all subfolders and bookmarks within it.`
    )) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteFolder({ folderId: folder._id });
      toast.success("Folder deleted successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete folder");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="select-none">
      <div
        className={`
          group flex items-center gap-1 py-1 px-2 rounded-md hover:bg-accent/50 transition-colors
          ${isSelected ? "bg-accent" : ""}
          ${isDeleting ? "opacity-50 pointer-events-none" : ""}
        `}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {/* Expand/Collapse Button */}
        {hasChildren ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <IconChevronDown className="h-4 w-4" />
            ) : (
              <IconChevronRight className="h-4 w-4" />
            )}
          </Button>
        ) : (
          <div className="w-5" />
        )}

        {/* Folder Icon */}
        <button
          type="button"
          onClick={() => onSelect(folder._id)}
          className="flex items-center gap-2 flex-1 cursor-pointer py-1 bg-transparent border-0 text-left"
          aria-expanded={isExpanded}
        >
          {isExpanded ? (
            <IconFolderOpen className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <IconFolder className="h-4 w-4 text-muted-foreground shrink-0" />
          )}

          {/* Folder Name */}
          <span className="text-sm truncate flex-1">{folder.name}</span>

          {/* Bookmark Count Badge */}
          {folder.bookmarkCount > 0 && (
            <Badge variant="secondary" className="text-xs h-5">
              {folder.bookmarkCount}
            </Badge>
          )}
        </button>

        {/* Context Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:opacity-100"
            >
              <span className="sr-only">Open menu</span>
              <IconEdit className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onRename(folder._id)}>
              <IconEdit className="mr-2 h-4 w-4" />
              Rename
            </DropdownMenuItem>
            {!isMaxDepth && (
              <DropdownMenuItem onClick={() => onNewSubfolder(folder._id)}>
                <IconPlus className="mr-2 h-4 w-4" />
                New Subfolder
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-destructive focus:text-destructive"
            >
              <IconTrash className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Render Children */}
      {isExpanded && hasChildren && (
        <div>
          {folder.children.map((child) => (
            <FolderTreeItem
              key={child._id}
              folder={child}
              level={level + 1}
              selectedFolderId={selectedFolderId}
              onSelect={onSelect}
              onNewSubfolder={onNewSubfolder}
              onRename={onRename}
            />
          ))}
        </div>
      )}
    </div>
  );
}
