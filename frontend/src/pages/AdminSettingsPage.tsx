import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { orderService } from "@/services/orderService";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Navigate } from "react-router-dom";

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rules, setRules] = useState<Record<string, number>>({});

  useEffect(() => {
    if (user?.roles?.includes("ROLE_ADMIN")) {
      orderService.getPricingRules()
        .then(setRules)
        .catch(() => toast.error("Failed to load pricing configuration"))
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (!user?.roles?.includes("ROLE_ADMIN")) {
    return <Navigate to="/" replace />;
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await orderService.updatePricingRules(rules);
      setRules(updated);
      toast.success("Pricing configuration saved successfully");
    } catch {
      toast.error("Failed to save pricing configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (key: string, val: string) => {
    const num = parseFloat(val);
    setRules(prev => ({
      ...prev,
      [key]: isNaN(num) ? 0 : num
    }));
  };

  if (loading) {
    return (
      <>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  // Group rules logically
  const standardKeys = ["STANDARD_PER_KILO", "EXPRESS_MULTIPLIER", "DRY_CLEAN_FEE"];
  const premiumKeys = Object.keys(rules).filter(k => k.startsWith("PREM_CAT_"));
  const otherKeys = Object.keys(rules).filter(k => !standardKeys.includes(k) && !premiumKeys.includes(k));

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Admin Settings</h1>
          <p className="text-gray-500 mt-2">Manage dynamic pricing configurations and catalog items.</p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <Card className="border-gray-200 shadow-none">
            <CardHeader>
              <CardTitle>Standard Variables</CardTitle>
              <CardDescription>Configure base multipliers and fees for standard laundry service.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {standardKeys.map(key => (
                  <div key={key} className="space-y-2">
                    <Label className="text-xs uppercase text-gray-500 font-semibold tracking-wider">
                      {key.replace(/_/g, " ")}
                    </Label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      min="0"
                      value={rules[key] ?? 0}
                      onChange={(e) => handleInputChange(key, e.target.value)}
                      className="font-mono bg-white"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-none">
            <CardHeader>
              <CardTitle>Premium Catalog</CardTitle>
              <CardDescription>Configure absolute prices for premium apparel.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {premiumKeys.length === 0 && <p className="text-sm text-gray-500 col-span-full">No premium items configured yet.</p>}
                {premiumKeys.map(key => (
                  <div key={key} className="space-y-2">
                    <Label className="text-xs uppercase text-gray-500 font-semibold tracking-wider">
                      {key.replace("PREM_CAT_", "").replace(/_/g, " ")}
                    </Label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      min="0"
                      value={rules[key] ?? 0}
                      onChange={(e) => handleInputChange(key, e.target.value)}
                      className="font-mono bg-white"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {otherKeys.length > 0 && (
            <Card className="border-gray-200 shadow-none">
              <CardHeader>
                <CardTitle>Other Variables</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {otherKeys.map(key => (
                    <div key={key} className="space-y-2">
                      <Label className="text-xs uppercase text-gray-500 font-semibold tracking-wider">
                        {key.replace(/_/g, " ")}
                      </Label>
                      <Input 
                        type="number" 
                        step="0.01" 
                        min="0"
                        value={rules[key] ?? 0}
                        onChange={(e) => handleInputChange(key, e.target.value)}
                        className="font-mono bg-white"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={saving} className="bg-blue-900 hover:bg-blue-800 text-white rounded-none px-8">
              {saving ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                <><Save className="mr-2 h-4 w-4" /> Save Configuration</>
              )}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
