"use client";

import * as React from "react";
import { IconPlus, IconCheck, IconChevronDown } from "@tabler/icons-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Doc, Id } from "@/convex/_generated/dataModel";

interface ProjectSwitcherProps {
  currentProjectId?: Id<"projects">;
  onProjectChange: (projectId: Id<"projects">) => void;
  onNewProject: () => void;
}

export function ProjectSwitcher({
  currentProjectId,
  onProjectChange,
  onNewProject,
}: ProjectSwitcherProps) {
  const projects = useQuery(api.projects.listUserProjects);

  const currentProject = React.useMemo(() => {
    if (!projects || !currentProjectId) return null;
    return projects.find((p: Doc<"projects">) => p._id === currentProjectId);
  }, [projects, currentProjectId]);

  if (!projects) {
    return (
      <Button variant="outline" className="w-full justify-between" disabled>
        <span className="truncate">Loading...</span>
        <IconChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <span className="truncate">
            {currentProject?.name || "Select project"}
          </span>
          <IconChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[200px]">
        <DropdownMenuLabel>Projects</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {projects.map((project: Doc<"projects">) => (
          <DropdownMenuItem
            key={project._id}
            onClick={() => onProjectChange(project._id)}
            className="flex items-center justify-between cursor-pointer"
          >
            <span className="truncate">{project.name}</span>
            <div className="flex items-center gap-1">
              {project.isDefault && (
                <Badge variant="secondary" className="text-xs">
                  Default
                </Badge>
              )}
              {currentProjectId === project._id && (
                <IconCheck className="h-4 w-4" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onNewProject} className="cursor-pointer">
          <IconPlus className="mr-2 h-4 w-4" />
          New Project
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
