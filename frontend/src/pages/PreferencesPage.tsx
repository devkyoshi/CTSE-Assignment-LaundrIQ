import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { customerService, Preferences } from "@/services/customerService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Settings, Bell, CreditCard, Package, Languages, Save } from "lucide-react";

export default function PreferencesPage() {
    const { user } = useAuth();
    const [preferences, setPreferences] = useState<Preferences | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<Preferences>({
        preferredLanguage: "en",
        emailNotifications: true,
        smsNotifications: false,
        preferredPaymentMethod: "CARD",
        preferredServiceType: "STANDARD",
        isExpressPreferred: false,
        isDryCleanPreferred: false
    });

    useEffect(() => {
        if (!user?.id) return;
        loadPreferences();
    }, [user]);

    const loadPreferences = async () => {
        setLoading(true);
        try {
            const prefs = await customerService.getPreferences(user!.id);
            setPreferences(prefs);
            setFormData(prefs);
        } catch (error) {
            toast.error("Failed to load preferences");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await customerService.setPreferences(user!.id, formData);
            toast.success("Preferences saved successfully");
            loadPreferences();
        } catch (error) {
            toast.error("Failed to save preferences");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 max-w-2xl mx-auto">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div className="border-b pb-4">
                <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <Settings className="h-8 w-8" />
                    Preferences
                </h1>
                <p className="text-sm text-muted-foreground mt-1">Customize your laundry experience</p>
            </div>

            <Card className="border-border">
                <CardHeader className="bg-slate-50 border-b border-border py-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Notifications
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="emailNotifications" className="font-medium">Email Notifications</Label>
                            <p className="text-sm text-muted-foreground">Receive order updates via email</p>
                        </div>
                        <Switch
                            id="emailNotifications"
                            checked={formData.emailNotifications}
                            onCheckedChange={(checked) => setFormData({ ...formData, emailNotifications: checked })}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="smsNotifications" className="font-medium">SMS Notifications</Label>
                            <p className="text-sm text-muted-foreground">Receive order updates via SMS</p>
                        </div>
                        <Switch
                            id="smsNotifications"
                            checked={formData.smsNotifications}
                            onCheckedChange={(checked) => setFormData({ ...formData, smsNotifications: checked })}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-border">
                <CardHeader className="bg-slate-50 border-b border-border py-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Languages className="h-5 w-5" />
                        Language & Regional
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div>
                        <Label htmlFor="language">Preferred Language</Label>
                        <Select
                            value={formData.preferredLanguage}
                            onValueChange={(value) => setFormData({ ...formData, preferredLanguage: value })}
                        >
                            <SelectTrigger id="language" className="mt-2">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="es">Spanish</SelectItem>
                                <SelectItem value="fr">French</SelectItem>
                                <SelectItem value="de">German</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-border">
                <CardHeader className="bg-slate-50 border-b border-border py-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Payment & Services
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div>
                        <Label htmlFor="paymentMethod">Preferred Payment Method</Label>
                        <Select
                            value={formData.preferredPaymentMethod}
                            onValueChange={(value) => setFormData({ ...formData, preferredPaymentMethod: value })}
                        >
                            <SelectTrigger id="paymentMethod" className="mt-2">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="CARD">Credit/Debit Card</SelectItem>
                                <SelectItem value="CASH">Cash on Delivery</SelectItem>
                                <SelectItem value="PAYPAL">PayPal</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="serviceType">Preferred Service Type</Label>
                        <Select
                            value={formData.preferredServiceType}
                            onValueChange={(value) => setFormData({ ...formData, preferredServiceType: value })}
                        >
                            <SelectTrigger id="serviceType" className="mt-2">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="STANDARD">Standard Laundry</SelectItem>
                                <SelectItem value="PREMIUM">Premium Laundry</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-border">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="expressPreferred" className="font-medium">Express Delivery</Label>
                                <p className="text-sm text-muted-foreground">Prefer express delivery (additional charges apply)</p>
                            </div>
                            <Switch
                                id="expressPreferred"
                                checked={formData.isExpressPreferred}
                                onCheckedChange={(checked) => setFormData({ ...formData, isExpressPreferred: checked })}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="dryCleanPreferred" className="font-medium">Dry Cleaning</Label>
                                <p className="text-sm text-muted-foreground">Prefer dry cleaning services</p>
                            </div>
                            <Switch
                                id="dryCleanPreferred"
                                checked={formData.isDryCleanPreferred}
                                onCheckedChange={(checked) => setFormData({ ...formData, isDryCleanPreferred: checked })}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Button onClick={handleSave} disabled={saving} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Preferences"}
            </Button>
        </div>
    );
}