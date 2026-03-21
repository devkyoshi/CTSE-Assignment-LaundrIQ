import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  mockCustomerService, 
  CustomerProfile, 
  Address, 
  Preferences 
} from "@/services/mockCustomerService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { MapPin, User, Settings } from "lucide-react";

export default function CustomerProfilePage() {
  const { user } = useAuth();
  
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [detergentType, setDetergentType] = useState("Standard");
  const [fabricSoftener, setFabricSoftener] = useState(false);
  
  // New Address form
  const [newAddrLabel, setNewAddrLabel] = useState("");
  const [newAddrStreet, setNewAddrStreet] = useState("");
  const [newAddrCity, setNewAddrCity] = useState("");
  const [newAddrZip, setNewAddrZip] = useState("");

  useEffect(() => {
    if (!user?.id) return;
    
    // Attempt to load mock data, or auto-create a profile
    Promise.all([
      mockCustomerService.getCustomerById(user.id),
      mockCustomerService.getAddresses(user.id),
      mockCustomerService.getPreferences(user.id)
    ]).then(async ([p, a, pref]) => {
      if (!p) {
        // Init profile
        p = await mockCustomerService.createCustomer({
          firstName: "John",
          lastName: "Doe",
          email: user.username + "@example.com",
          phone: "000-000-0000"
        });
        // Override id to match auth user for mock consistency
        p.id = user.id;
        await mockCustomerService.updateCustomer(p.id, p);
      }
      setProfile(p);
      setFirstName(p.firstName);
      setLastName(p.lastName);
      setPhone(p.phone || "");

      setAddresses(a);

      if (!pref) {
        pref = await mockCustomerService.setPreferences(user.id, {
          detergentType: "Standard",
          fabricSoftener: false,
          notes: ""
        });
      }
      setPreferences(pref);
      setDetergentType(pref.detergentType);
      setFabricSoftener(pref.fabricSoftener);
    }).finally(() => {
      setLoading(false);
    });
  }, [user]);

  const saveProfile = async () => {
    if (!profile) return;
    try {
      await mockCustomerService.updateCustomer(profile.id, { firstName, lastName, phone });
      toast.success("Profile saved");
    } catch {
      toast.error("Failed to save profile");
    }
  };

  const savePreferences = async () => {
    if (!user?.id) return;
    try {
      await mockCustomerService.setPreferences(user.id, {
        detergentType,
        fabricSoftener,
        notes: preferences?.notes || ""
      });
      toast.success("Preferences updated");
    } catch {
      toast.error("Failed to update preferences");
    }
  };

  const addAddress = async () => {
    if (!user?.id || !newAddrStreet) return;
    try {
      const addr = await mockCustomerService.addAddress(user.id, {
        label: newAddrLabel || "Home",
        street: newAddrStreet,
        city: newAddrCity,
        zipCode: newAddrZip
      });
      setAddresses([...addresses, addr]);
      setNewAddrLabel(""); setNewAddrStreet(""); setNewAddrCity(""); setNewAddrZip("");
      toast.success("Address added");
    } catch {
      toast.error("Failed to add address");
    }
  };

  const deleteAddress = async (id: string) => {
    try {
      await mockCustomerService.deleteAddress(id);
      setAddresses(addresses.filter(a => a.id !== id));
      toast.success("Address deleted");
    } catch {
      toast.error("Failed to delete address");
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">My Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your details, addresses, and laundry settings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <User className="h-5 w-5 text-primary" /> Personal Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input value={firstName} onChange={e => setFirstName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input value={lastName} onChange={e => setLastName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={profile?.email} disabled />
            </div>
            <Button onClick={saveProfile} className="w-full">Save Changes</Button>
          </CardContent>
        </Card>

        {/* Preferences Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" /> Laundry Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Detergent Type</Label>
              <Input 
                value={detergentType} 
                onChange={e => setDetergentType(e.target.value)}
                placeholder="Standard, Hypoallergenic, etc." 
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Fabric Softener</Label>
                <CardDescription>Include fabric softener in my wash</CardDescription>
              </div>
              <Switch checked={fabricSoftener} onCheckedChange={setFabricSoftener} />
            </div>
            <Button onClick={savePreferences} variant="outline" className="w-full">Update Preferences</Button>
          </CardContent>
        </Card>
      </div>

      {/* Addresses Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" /> My Addresses
          </CardTitle>
        </CardHeader>
        <CardContent>
          {addresses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {addresses.map(a => (
                <div key={a.id} className="border p-4 rounded-md relative flex flex-col">
                  <span className="font-semibold text-primary">{a.label}</span>
                  <span className="text-sm text-muted-foreground mt-1">{a.street}</span>
                  <span className="text-sm text-muted-foreground">{a.city}, {a.zipCode}</span>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="absolute top-2 right-2 h-7"
                    onClick={() => deleteAddress(a.id)}
                  >
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mb-6">No addresses found.</p>
          )}

          <div className="border-t pt-6 space-y-4">
            <h3 className="font-medium">Add New Address</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Label</Label>
                <Input placeholder="Home, Office..." value={newAddrLabel} onChange={e => setNewAddrLabel(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Street</Label>
                <Input value={newAddrStreet} onChange={e => setNewAddrStreet(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={newAddrCity} onChange={e => setNewAddrCity(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Zip Code</Label>
                <Input value={newAddrZip} onChange={e => setNewAddrZip(e.target.value)} />
              </div>
            </div>
            <Button onClick={addAddress} className="mt-2">Add Address</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
