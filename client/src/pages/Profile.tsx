"use client";

import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const APP_VERSION = "1.2.0";

export default function Profile() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ") || "Student";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Profile</h1>
        <p className="text-muted-foreground mt-1">Your account details.</p>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Avatar className="h-14 w-14 border-2 border-border">
              <AvatarImage src={user.profileImageUrl || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                {user.firstName?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <span>{displayName}</span>
          </CardTitle>
          <CardDescription>Signed in with your Syllatra account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</p>
            <p className="text-sm font-medium mt-1">{user.email ?? "—"}</p>
          </div>
          {user.firstName && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">First name</p>
              <p className="text-sm font-medium mt-1">{user.firstName}</p>
            </div>
          )}
          {user.lastName && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Last name</p>
              <p className="text-sm font-medium mt-1">{user.lastName}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="max-w-xl pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Syllatra v{APP_VERSION}
        </p>
      </div>
    </div>
  );
}
