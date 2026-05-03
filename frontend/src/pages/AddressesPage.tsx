import { useEffect, useState } from "react";
import { customerService, Address } from "@/services/customerService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Home, MapPin, Phone, Plus, Edit2, Trash2, Star, Building, Briefcase } from "lucide-react";

export default function AddressesPage() {
    const { user } = useAuth();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    const [formData, setFormData] = useState({
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "",
        phoneNumber: "",
        isDefault: false,
        addressType: "HOME"
    });

    useEffect(() => {
        if (!user?.id) return;
        loadAddresses();
    }, [user]);

    const loadAddresses = () => {
        setLoading(true);
        customerService.getAddresses(user!.id)
            .then(setAddresses)
            .catch(() => toast.error("Failed to load addresses"))
            .finally(() => setLoading(false));
    };

    const resetForm = () => {
        setFormData({
            addressLine1: "",
            addressLine2: "",
            city: "",
            state: "",
            postalCode: "",
            country: "",
            phoneNumber: "",
            isDefault: false,
            addressType: "HOME"
        });
        setEditingAddress(null);
    };

    const handleSubmit = async () => {
        try {
            const addressRequest = {
                ...formData,
                customerId: user!.id
            };

            if (editingAddress) {
                await customerService.updateAddress(editingAddress.id, addressRequest);
                toast.success("Address updated successfully");
            } else {
                await customerService.addAddress(addressRequest);
                toast.success("Address added successfully");
            }
            setDialogOpen(false);
            resetForm();
            loadAddresses();
        } catch (error) {
            toast.error(editingAddress ? "Failed to update address" : "Failed to add address");
        }
    };

    const handleDelete = async (addressId: number) => {
        if (!confirm("Are you sure you want to delete this address?")) return;
        try {
            await customerService.deleteAddress(addressId, user!.id);
            toast.success("Address deleted successfully");
            loadAddresses();
        } catch (error) {
            toast.error("Failed to delete address");
        }
    };

    const getAddressTypeIcon = (type: string) => {
        switch (type) {
            case "HOME": return <Home className="h-4 w-4" />;
            case "WORK": return <Briefcase className="h-4 w-4" />;
            default: return <Building className="h-4 w-4" />;
        }
    };

    if (loading) {
        return (
            <div className="space-y-4 max-w-4xl mx-auto">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between border-b pb-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <MapPin className="h-8 w-8" />
                        Our Addresses
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage your delivery addresses</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={resetForm}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add New Address
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>{editingAddress ? "Edit Address" : "Add New Address"}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <Label htmlFor="addressLine1">Address Line 1 *</Label>
                                    <Input
                                        id="addressLine1"
                                        value={formData.addressLine1}
                                        onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                                        placeholder="Street address"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <Label htmlFor="addressLine2">Address Line 2</Label>
                                    <Input
                                        id="addressLine2"
                                        value={formData.addressLine2}
                                        onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                                        placeholder="Apartment, suite, etc."
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="city">City *</Label>
                                    <Input
                                        id="city"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="state">State *</Label>
                                    <Input
                                        id="state"
                                        value={formData.state}
                                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="postalCode">Postal Code *</Label>
                                    <Input
                                        id="postalCode"
                                        value={formData.postalCode}
                                        onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="country">Country *</Label>
                                    <Input
                                        id="country"
                                        value={formData.country}
                                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="phoneNumber">Phone Number</Label>
                                    <Input
                                        id="phoneNumber"
                                        value={formData.phoneNumber}
                                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                        placeholder="Contact number for delivery"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="addressType">Address Type</Label>
                                    <Select
                                        value={formData.addressType}
                                        onValueChange={(value) => setFormData({ ...formData, addressType: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="HOME">Home</SelectItem>
                                            <SelectItem value="WORK">Work</SelectItem>
                                            <SelectItem value="OTHER">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="isDefault"
                                    checked={formData.isDefault}
                                    onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked as boolean })}
                                />
                                <Label htmlFor="isDefault">Set as default address</Label>
                            </div>
                            <Button onClick={handleSubmit} className="w-full">
                                {editingAddress ? "Update Address" : "Add Address"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {addresses.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="py-12 text-center">
                        <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No addresses added yet</p>
                        <Button variant="link" onClick={() => setDialogOpen(true)} className="mt-2">
                            Add your first address
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((address) => (
                        <Card key={address.id} className={`border-border relative ${address.isDefault ? 'border-primary/50 bg-primary/5' : ''}`}>
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        {getAddressTypeIcon(address.addressType)}
                                        <span className="font-semibold text-foreground">{address.addressType}</span>
                                        {address.isDefault && (
                                            <Badge variant="secondary" className="text-xs">
                                                <Star className="h-3 w-3 mr-1 fill-current" />
                                                Default
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                setEditingAddress(address);
                                                setFormData({
                                                    addressLine1: address.addressLine1,
                                                    addressLine2: address.addressLine2 || "",
                                                    city: address.city,
                                                    state: address.state,
                                                    postalCode: address.postalCode,
                                                    country: address.country,
                                                    phoneNumber: address.phoneNumber || "",
                                                    isDefault: address.isDefault,
                                                    addressType: address.addressType
                                                });
                                                setDialogOpen(true);
                                            }}
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(address.id)}
                                            className="text-destructive hover:text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-1 text-sm">
                                    <p className="font-medium">{address.addressLine1}</p>
                                    {address.addressLine2 && <p className="text-muted-foreground">{address.addressLine2}</p>}
                                    <p className="text-muted-foreground">
                                        {address.city}, {address.state} {address.postalCode}
                                    </p>
                                    <p className="text-muted-foreground">{address.country}</p>
                                    {address.phoneNumber && (
                                        <p className="flex items-center gap-1 text-muted-foreground mt-2">
                                            <Phone className="h-3 w-3" />
                                            {address.phoneNumber}
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}