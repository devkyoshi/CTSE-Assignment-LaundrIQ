import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { customerService, Profile } from "@/services/customerService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { User, Mail, Shield, Save, Edit2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    customerService.getProfile(user.id)
        .then(setProfile)
        .catch(() => toast.error("Failed to load profile"))
        .finally(() => setLoading(false));
  }, [user]);

  // Fixed getInitials function to handle null/undefined
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "??";
    return name.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
        <div className="space-y-6 max-w-2xl mx-auto">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
    );
  }

  if (!profile) {
    return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Profile not found</p>
        </div>
    );
  }

  return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="border-b pb-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">My Profile</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your account information</p>
        </div>

        <Card className="border-border">
          <CardHeader className="bg-slate-50 border-b border-border py-4 flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setEditing(!editing)}>
              <Edit2 className="h-4 w-4 mr-2" />
              {editing ? "Cancel" : "Edit"}
            </Button>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center gap-4 pb-4 border-b border-border">
              <Avatar className="h-20 w-20 bg-primary/10">
                <AvatarFallback className="text-lg font-bold text-primary">
                  {getInitials(profile.username)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-semibold text-foreground">{profile.username}</h2>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Mail className="h-3 w-3" />
                  {profile.email}
                </p>
                <div className="flex gap-2 mt-2">
                  {profile.roles?.split(",").map((role, i) => (
                      <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    {role.trim()}
                  </span>
                  ))}
                </div>
              </div>
            </div>

            {editing ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" defaultValue={profile.username} />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue={profile.email} />
                  </div>
                  <Button className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
            ) : (
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Username</span>
                    <span className="font-medium">{profile.username}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Email</span>
                    <span className="font-medium">{profile.email}</span>
                  </div>
                  <div className="flex justify-between py-2">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Shield className="h-4 w-4" />
                  Account Status
                </span>
                    <Badge className={profile.active ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-red-100 text-red-800 hover:bg-red-100"}>
                      {profile.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
  );
}