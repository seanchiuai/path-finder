"use client";

import * as React from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Authenticated } from "convex/react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { NavUser } from "@/components/nav-user";
import { ProjectSwitcher } from "@/components/features/project-switcher";
import { FolderTree } from "@/components/features/folder-tree";
import { NewProjectDialog } from "@/components/features/new-project-dialog";
import { NewFolderDialog } from "@/components/features/new-folder-dialog";
import { RenameFolderDialog } from "@/components/features/rename-folder-dialog";
import { IconBookmark } from "@tabler/icons-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

function BookmarksSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [currentProjectId, setCurrentProjectId] = React.useState<Id<"projects"> | undefined>();
  const [selectedFolderId, setSelectedFolderId] = React.useState<Id<"folders"> | undefined>();
  const [newProjectDialogOpen, setNewProjectDialogOpen] = React.useState(false);
  const [newFolderDialogOpen, setNewFolderDialogOpen] = React.useState(false);
  const [renameFolderDialogOpen, setRenameFolderDialogOpen] = React.useState(false);
  const [parentFolderIdForNew, setParentFolderIdForNew] = React.useState<Id<"folders"> | undefined>();
  const [folderIdToRename, setFolderIdToRename] = React.useState<Id<"folders"> | null>(null);

  const defaultProject = useQuery(api.projects.getDefaultProject);
  const initializeDefaults = useMutation(api.init.initializeUserDefaults);

  // Initialize defaults and set current project on first load
  React.useEffect(() => {
    const init = async () => {
      if (defaultProject === undefined) return; // Still loading

      if (defaultProject === null) {
        // No default project, initialize
        try {
          const result = await initializeDefaults({});
          if (result.initialized && result.projectId) {
            setCurrentProjectId(result.projectId);
          }
        } catch (error) {
          console.error("Failed to initialize default project:", error);
          toast.error("Failed to initialize workspace. Please refresh the page.");
          return;
        }
      } else {
        setCurrentProjectId(defaultProject._id);
      }
    };

    init();
  }, [defaultProject, initializeDefaults]);

  const handleNewFolder = (parentFolderId?: Id<"folders">) => {
    setParentFolderIdForNew(parentFolderId);
    setNewFolderDialogOpen(true);
  };

  const handleRenameFolder = (folderId: Id<"folders">) => {
    setFolderIdToRename(folderId);
    setRenameFolderDialogOpen(true);
  };

  return (
    <>
      <Sidebar collapsible="offcanvas" {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className="data-[slot=sidebar-menu-button]:!p-1.5"
              >
                <a href="/bookmarks">
                  <IconBookmark className="!size-5" />
                  <span className="text-base font-semibold">Bookmarks</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <Separator className="my-2" />
          <div className="px-2">
            <ProjectSwitcher
              currentProjectId={currentProjectId}
              onProjectChange={setCurrentProjectId}
              onNewProject={() => setNewProjectDialogOpen(true)}
            />
          </div>
        </SidebarHeader>
        <SidebarContent>
          {currentProjectId && (
            <FolderTree
              projectId={currentProjectId}
              selectedFolderId={selectedFolderId}
              onSelectFolder={setSelectedFolderId}
              onNewFolder={handleNewFolder}
              onRenameFolder={handleRenameFolder}
            />
          )}
        </SidebarContent>
        <SidebarFooter>
          <NavUser />
        </SidebarFooter>
      </Sidebar>

      <NewProjectDialog
        open={newProjectDialogOpen}
        onOpenChange={setNewProjectDialogOpen}
      />

      {currentProjectId && (
        <>
          <NewFolderDialog
            open={newFolderDialogOpen}
            onOpenChange={setNewFolderDialogOpen}
            projectId={currentProjectId}
            parentFolderId={parentFolderIdForNew}
            onSuccess={() => setParentFolderIdForNew(undefined)}
          />

          <RenameFolderDialog
            open={renameFolderDialogOpen}
            onOpenChange={setRenameFolderDialogOpen}
            folderId={folderIdToRename}
            onSuccess={() => setFolderIdToRename(null)}
          />
        </>
      )}
    </>
  );
}

export default function BookmarksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Authenticated>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <BookmarksSidebar variant="inset" />
        <SidebarInset className="texture-minimal">
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              {children}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </Authenticated>
  );
}
