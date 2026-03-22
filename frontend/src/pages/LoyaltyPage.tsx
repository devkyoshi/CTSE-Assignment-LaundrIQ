import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight, Gift, TrendingUp, Award, Star, Zap } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/helpers";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {LoyaltyAccount, loyaltyService, LoyaltyTransaction} from "@/services/loyaltyService.ts";

const TIER_CONFIG: Record<string, { color: string; icon: any; label: string; minPoints: number }> = {
    BRONZE: { color: "bg-amber-600", icon: Award, label: "Bronze", minPoints: 0 },
    SILVER: { color: "bg-gray-400", icon: Award, label: "Silver", minPoints: 1000 },
    GOLD: { color: "bg-yellow-500", icon: Award, label: "Gold", minPoints: 5000 },
    PLATINUM: { color: "bg-indigo-500", icon: Award, label: "Platinum", minPoints: 10000 }
};

const TIER_MULTIPLIERS: Record<string, number> = {
    BRONZE: 1.0,
    SILVER: 1.2,
    GOLD: 1.5,
    PLATINUM: 2.0
};

export default function LoyaltyPage() {
    const { user } = useAuth();
    const [account, setAccount] = useState<LoyaltyAccount | null>(null);
    const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    useEffect(() => {
        if (!user?.id) return;
        loadData();
    }, [user, page]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [acc, txns] = await Promise.all([
                loyaltyService.getAccount(user!.id),
                loyaltyService.getTransactions(user!.id, page, 10)
            ]);
            setAccount(acc);
            setTransactions(txns.content);
            setTotalPages(txns.totalPages);
        } catch (error: any) {
            // If account doesn't exist, create it
            if (error.response?.status === 404) {
                try {
                    const newAccount = await loyaltyService.createAccount(user!.id);
                    setAccount(newAccount);
                    const txns = await loyaltyService.getTransactions(user!.id, page, 10);
                    setTransactions(txns.content);
                    setTotalPages(txns.totalPages);
                } catch (createError) {
                    toast.error("Failed to initialize loyalty account");
                }
            } else {
                toast.error("Failed to load loyalty data");
            }
        } finally {
            setLoading(false);
        }
    };

    const getProgressToNextTier = () => {
        if (!account) return 0;
        const nextTierPoints = account.pointsToNextTier;
        const currentTierPoints = account.lifetimePoints - (account.lifetimePoints - nextTierPoints);
        const totalNeeded = nextTierPoints;
        const progress = ((account.lifetimePoints - (account.lifetimePoints - nextTierPoints)) / totalNeeded) * 100;
        return Math.min(100, Math.max(0, progress));
    };

    const getTransactionIcon = (type: string) => {
        return type === "EARNED" ? TrendingUp : Gift;
    };

    const getTransactionColor = (type: string) => {
        return type === "EARNED" ? "text-green-600" : "text-blue-600";
    };

    if (loading) {
        return (
            <div className="space-y-6 max-w-4xl mx-auto">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (!account) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">Unable to load loyalty account</p>
            </div>
        );
    }

    const currentTier = TIER_CONFIG[account.tier];
    const TierIcon = currentTier.icon;
    const nextTier = Object.values(TIER_CONFIG).find(t => t.minPoints > account.lifetimePoints);
    const progress = getProgressToNextTier();

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="border-b pb-4">
                <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <Award className="h-8 w-8 text-yellow-500" />
                    Loyalty Rewards
                </h1>
                <p className="text-sm text-muted-foreground mt-1">Earn points on every order and unlock exclusive benefits</p>
            </div>

            {/* Main Points Card */}
            <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-primary/20">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Total Points</p>
                            <p className="text-5xl font-bold text-foreground">{account.totalPoints.toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Lifetime: {account.lifetimePoints.toLocaleString()} points
                            </p>
                        </div>
                        <div className="text-center md:text-right">
                            <Badge className={`${currentTier.color} text-white px-4 py-2 text-lg`}>
                                <TierIcon className="h-5 w-5 mr-2 inline" />
                                {currentTier.label}
                            </Badge>
                            <p className="text-sm text-muted-foreground mt-2">
                                {TIER_MULTIPLIERS[account.tier]}x points multiplier
                            </p>
                        </div>
                    </div>

                    {nextTier && (
                        <div className="mt-6">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-muted-foreground">Progress to {nextTier.label}</span>
                                <span className="text-muted-foreground">
                  {account.lifetimePoints.toLocaleString()} / {nextTier.minPoints.toLocaleString()} points
                </span>
                            </div>
                            <Progress value={progress} className="h-3" />
                            <p className="text-xs text-muted-foreground mt-2">
                                {account.pointsToNextTier.toLocaleString()} more points to reach {nextTier.label}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Tier Benefits */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Star className="h-5 w-5" />
                        Tier Benefits
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(TIER_CONFIG).map(([tier, config]) => (
                            <div
                                key={tier}
                                className={`p-4 rounded-lg text-center transition-all ${
                                    account.tier === tier
                                        ? `bg-primary/10 border-2 border-primary/50`
                                        : "bg-muted/50 border border-border"
                                }`}
                            >
                                <config.icon className={`h-8 w-8 mx-auto mb-2 ${account.tier === tier ? "text-primary" : "text-muted-foreground"}`} />
                                <p className="font-semibold">{config.label}</p>
                                <p className="text-xs text-muted-foreground">{TIER_MULTIPLIERS[tier]}x Points</p>
                                {account.tier === tier && (
                                    <Badge variant="default" className="mt-2 text-xs">Current</Badge>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* How to Earn */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Zap className="h-5 w-5" />
                        How to Earn Points
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-primary font-bold">10</span>
                            </div>
                            <div>
                                <p className="font-medium">Per $1 Spent</p>
                                <p className="text-xs text-muted-foreground">Base points on order value</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Zap className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="font-medium">Tier Multiplier</p>
                                <p className="text-xs text-muted-foreground">Up to 2x points based on tier</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Gift className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="font-medium">Special Promotions</p>
                                <p className="text-xs text-muted-foreground">Bonus points on selected services</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Transaction History */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Transaction History</CardTitle>
                </CardHeader>
                <CardContent>
                    {transactions.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground">No transactions yet</p>
                            <p className="text-sm text-muted-foreground mt-1">Place an order to start earning points!</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead className="text-right">Points</TableHead>
                                            <TableHead className="text-right">Balance After</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {transactions.map((tx) => {
                                            const Icon = getTransactionIcon(tx.type);
                                            const color = getTransactionColor(tx.type);
                                            return (
                                                <TableRow key={tx.id}>
                                                    <TableCell className="text-sm">
                                                        {formatDate(tx.createdAt)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Icon className={`h-4 w-4 ${color}`} />
                                                            <span className="capitalize">{tx.type.toLowerCase()}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="max-w-xs truncate">
                                                        {tx.description}
                                                    </TableCell>
                                                    <TableCell className={`text-right font-semibold ${tx.points > 0 ? "text-green-600" : "text-blue-600"}`}>
                                                        {tx.points > 0 ? `+${tx.points}` : tx.points}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {tx.balanceAfter.toLocaleString()}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex justify-center gap-2 mt-6">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => Math.max(0, p - 1))}
                                        disabled={page === 0}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <span className="py-2 px-3 text-sm">
                    Page {page + 1} of {totalPages}
                  </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                        disabled={page === totalPages - 1}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Info Note */}
            <div className="text-center text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
                <p>Points are automatically added when orders are completed. 100 points = $1 discount on future orders.</p>
            </div>
        </div>
    );
}