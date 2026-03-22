// pages/ProfilePage.tsx
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { authService, UserProfile, ProfileUpdateRequest } from "@/services/authService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { User, Mail, Shield, Save, Edit2, Lock, Trash2, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ProfilePage() {
  const { user } = useAuth(); // Just use user from existing context, don't modify it
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [deletePassword, setDeletePassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load profile data
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await authService.getProfile();
      if (response.success) {
        setProfile(response.data);
      } else {
        toast.error(response.message || "Failed to load profile");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "??";
    return name.substring(0, 2).toUpperCase();
  };

  const handleEditClick = () => {
    if (profile) {
      setFormData({
        username: profile.username,
        email: profile.email,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setErrors({});
    }
    setEditing(!editing);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.newPassword && !formData.currentPassword) {
      newErrors.currentPassword = "Current password is required to set a new password";
    }

    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (formData.newPassword && formData.newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const updateData: ProfileUpdateRequest = {};

    if (formData.username !== profile?.username) {
      updateData.username = formData.username;
    }

    if (formData.email !== profile?.email) {
      updateData.email = formData.email;
    }

    if (formData.newPassword) {
      updateData.currentPassword = formData.currentPassword;
      updateData.newPassword = formData.newPassword;
    }

    if (Object.keys(updateData).length === 0) {
      toast.info("No changes to save");
      setEditing(false);
      return;
    }

    try {
      setUpdating(true);
      const response = await authService.updateProfile(updateData);

      if (response.success) {
        setProfile(response.data);
        toast.success("Profile updated successfully");
        setEditing(false);
        setFormData({
          username: "",
          email: "",
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        toast.error(response.message || "Failed to update profile");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error("Please enter your password to confirm deletion");
      return;
    }

    try {
      const response = await authService.deleteAccount(deletePassword);

      if (response.success) {
        toast.success("Account deactivated successfully");
        setShowDeleteDialog(false);
        // Use the logout function from your AuthContext
        // Assuming your AuthContext has a logout function
        window.location.href = "/login";
      } else {
        toast.error(response.message || "Failed to deactivate account");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to deactivate account");
    }
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
            <Button variant="ghost" size="sm" onClick={handleEditClick} disabled={updating}>
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
                  {Array.isArray(profile.roles) && profile.roles.map((role, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {role.replace("ROLE_", "")}
                      </Badge>
                  ))}
                </div>
              </div>
            </div>

            {editing ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div className="pt-4 border-t">
                    <Label className="flex items-center gap-2 mb-2">
                      <Lock className="h-4 w-4" />
                      Change Password
                    </Label>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input
                            id="currentPassword"
                            type="password"
                            placeholder="Enter current password to change"
                            value={formData.currentPassword}
                            onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                        />
                        {errors.currentPassword && (
                            <p className="text-sm text-red-500 mt-1">{errors.currentPassword}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                            id="newPassword"
                            type="password"
                            placeholder="Enter new password (min 6 characters)"
                            value={formData.newPassword}
                            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                        />
                        {errors.newPassword && (
                            <p className="text-sm text-red-500 mt-1">{errors.newPassword}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="Confirm new password"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        />
                        {errors.confirmPassword && (
                            <p className="text-sm text-red-500 mt-1">{errors.confirmPassword}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button className="w-full" onClick={handleSave} disabled={updating}>
                    <Save className="h-4 w-4 mr-2" />
                    {updating ? "Saving..." : "Save Changes"}
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
                  <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Member Since
                </span>
                    <span className="font-medium">
                  {new Date(profile.createdAt).toLocaleDateString()}
                </span>
                  </div>
                  <div className="flex justify-between py-2">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Shield className="h-4 w-4" />
                  Account Status
                </span>
                    <Badge className={profile.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {profile.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
            )}
          </CardContent>
        </Card>

        {!editing && (
            <Card className="border-red-200">
              <CardHeader className="bg-red-50 border-b border-red-200 py-4">
                <CardTitle className="text-lg flex items-center gap-2 text-red-700">
                  <Trash2 className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800">
                    Once you delete your account, there is no going back. Please be certain.
                  </AlertDescription>
                </Alert>
                <Button
                    variant="destructive"
                    className="mt-4"
                    onClick={() => setShowDeleteDialog(true)}
                >
                  Delete Account
                </Button>
              </CardContent>
            </Card>
        )}

        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Account</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete your account
                and remove your data from our servers.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="deletePassword">Enter your password to confirm</Label>
                <Input
                    id="deletePassword"
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Your password"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteAccount}>
                Yes, Delete My Account
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  );
}