"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IconBookmark, IconPlus } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

export default function BookmarksPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bookmarks</h1>
          <p className="text-muted-foreground">
            Organize and manage your bookmarks
          </p>
        </div>
        <Button>
          <IconPlus className="mr-2 h-4 w-4" />
          Add Bookmark
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconBookmark className="h-5 w-5" />
              Getting Started
            </CardTitle>
            <CardDescription>
              Your bookmark management system is ready
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>Create projects to organize bookmarks</li>
              <li>Create folders within projects</li>
              <li>Add bookmarks to folders</li>
              <li>Search and filter bookmarks</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks to get started</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Use the sidebar to:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Switch between projects</li>
              <li>Create new folders</li>
              <li>Organize your bookmarks</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Features</CardTitle>
            <CardDescription>What you can do</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Nested folders (up to 5 levels)</li>
              <li>Multiple projects</li>
              <li>Real-time sync</li>
              <li>Secure & private</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
