import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/services/authService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Droplets } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const res = await authService.login(username, password);
      if (res.success) {
        login(res.data);
        toast.success(res.message || "Logged in successfully");
        navigate("/");
      } else {
        toast.error(res.message || "Login failed");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Droplets className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Welcome Back</CardTitle>
          <CardDescription>Sign in to manage your orders</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter username" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary hover:underline font-medium">Register</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
