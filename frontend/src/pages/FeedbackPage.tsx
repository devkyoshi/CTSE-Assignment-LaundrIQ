import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { feedbackService, Feedback, FeedbackSummary, FeedbackRequest } from "@/services/feedbackService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Star, MessageSquare, Edit2, Trash2, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/helpers";

const RATINGS = [5, 4, 3, 2, 1];
const FEEDBACK_CATEGORIES = [
    "SERVICE_QUALITY",
    "CLEANLINESS",
    "PUNCTUALITY",
    "CUSTOMER_SUPPORT",
    "PRICE_VALUE",
    "DELIVERY",
    "OTHER"
];

const CATEGORY_LABELS: Record<string, string> = {
    SERVICE_QUALITY: "Service Quality",
    CLEANLINESS: "Cleanliness",
    PUNCTUALITY: "Punctuality",
    CUSTOMER_SUPPORT: "Customer Support",
    PRICE_VALUE: "Price & Value",
    DELIVERY: "Delivery",
    OTHER: "Other"
};

const STATUS_VARIANTS: Record<string, string> = {
    PENDING: "secondary",
    RESPONDED: "success",
    RESOLVED: "success"
};

export default function FeedbackPage() {
    const { user } = useAuth();
    const [feedbacks, setFeedbacks] = useState<FeedbackSummary[]>([]);
    const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingFeedback, setEditingFeedback] = useState<Feedback | null>(null);
    const [averageRating, setAverageRating] = useState<number>(0);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [formData, setFormData] = useState<FeedbackRequest>({
        orderId: "",
        rating: 5,
        category: "SERVICE_QUALITY",
        comment: "",
        isPublic: true
    });

    useEffect(() => {
        if (!user?.id) return;
        loadData();
    }, [user, page]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [history, avg] = await Promise.all([
                feedbackService.getFeedbackHistory(user.id, page, 10),
                feedbackService.getAverageRating(user.id)
            ]);
            setFeedbacks(history.content);
            setTotalPages(history.totalPages);
            setAverageRating(avg);
        } catch (error) {
            toast.error("Failed to load feedback");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        try {
            if (editingFeedback) {
                await feedbackService.updateFeedback(
                    user!.id,
                    editingFeedback.id,
                    {
                        rating: formData.rating,
                        category: formData.category,
                        comment: formData.comment,
                        isPublic: formData.isPublic
                    }
                );
                toast.success("Feedback updated successfully");
            } else {
                await feedbackService.submitFeedback(user!.id, formData);
                toast.success("Feedback submitted successfully");
            }
            setDialogOpen(false);
            resetForm();
            loadData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to submit feedback");
        }
    };

    const handleDelete = async (feedbackId: number) => {
        if (!confirm("Are you sure you want to delete this feedback?")) return;
        try {
            await feedbackService.deleteFeedback(user!.id, feedbackId);
            toast.success("Feedback deleted successfully");
            loadData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to delete feedback");
        }
    };

    const resetForm = () => {
        setFormData({
            orderId: "",
            rating: 5,
            category: "SERVICE_QUALITY",
            comment: "",
            isPublic: true
        });
        setEditingFeedback(null);
    };

    const handleEdit = (feedback: Feedback) => {
        setEditingFeedback(feedback);
        setFormData({
            orderId: feedback.orderId,
            rating: feedback.rating,
            category: feedback.category,
            comment: feedback.comment,
            isPublic: feedback.isPublic
        });
        setDialogOpen(true);
    };

    const viewDetails = async (feedbackId: number) => {
        try {
            const feedback = await feedbackService.getFeedback(user!.id, feedbackId);
            setSelectedFeedback(feedback);
        } catch (error) {
            toast.error("Failed to load feedback details");
        }
    };

    const RatingStars = ({ rating, size = "md" }: { rating: number; size?: "sm" | "md" | "lg" }) => {
        const sizes = { sm: "h-3 w-3", md: "h-4 w-4", lg: "h-5 w-5" };
        return (
            <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`${sizes[size]} ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                    />
                ))}
            </div>
        );
    };

    if (loading && page === 0) {
        return (
            <div className="space-y-6 max-w-4xl mx-auto">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <MessageSquare className="h-8 w-8" />
                        My Feedback
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">Share your experience and view responses</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={resetForm}>
                            <Plus className="h-4 w-4 mr-2" />
                            New Feedback
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>{editingFeedback ? "Edit Feedback" : "Submit Feedback"}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <Label htmlFor="orderId">Order ID *</Label>
                                <Input
                                    id="orderId"
                                    value={formData.orderId}
                                    onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                                    placeholder="Enter order ID"
                                    disabled={!!editingFeedback}
                                />
                            </div>

                            <div>
                                <Label>Rating *</Label>
                                <div className="flex gap-2 mt-2">
                                    {RATINGS.map((rating) => (
                                        <Button
                                            key={rating}
                                            type="button"
                                            variant={formData.rating === rating ? "default" : "outline"}
                                            onClick={() => setFormData({ ...formData, rating })}
                                            className="flex-1"
                                        >
                                            {rating} ★
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="category">Category *</Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {FEEDBACK_CATEGORIES.map((cat) => (
                                            <SelectItem key={cat} value={cat}>
                                                {CATEGORY_LABELS[cat]}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="comment">Comment *</Label>
                                <Textarea
                                    id="comment"
                                    value={formData.comment}
                                    onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                                    placeholder="Tell us about your experience..."
                                    rows={5}
                                />
                            </div>

                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="isPublic"
                                    checked={formData.isPublic}
                                    onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                                    className="h-4 w-4 rounded border-gray-300"
                                />
                                <Label htmlFor="isPublic">Make this feedback public</Label>
                            </div>

                            <Button onClick={handleSubmit} className="w-full">
                                {editingFeedback ? "Update Feedback" : "Submit Feedback"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Average Rating Card */}
            <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Your Average Rating</p>
                            <p className="text-4xl font-bold text-foreground">{averageRating.toFixed(1)}</p>
                        </div>
                        <div className="text-right">
                            <RatingStars rating={Math.round(averageRating)} size="lg" />
                            <p className="text-sm text-muted-foreground mt-2">Based on {feedbacks.length} reviews</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Feedback List */}
            {feedbacks.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="py-12 text-center">
                        <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No feedback submitted yet</p>
                        <Button variant="link" onClick={() => setDialogOpen(true)} className="mt-2">
                            Share your first review
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {feedbacks.map((feedback) => (
                        <Card
                            key={feedback.id}
                            className="border-border hover:border-primary/30 transition-all cursor-pointer"
                            onClick={() => viewDetails(feedback.id)}
                        >
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <RatingStars rating={feedback.rating} />
                                        <Badge variant={STATUS_VARIANTS[feedback.status] as any}>
                                            {feedback.status}
                                        </Badge>
                                        <Badge variant="outline">{CATEGORY_LABELS[feedback.category]}</Badge>
                                    </div>
                                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleEdit(feedback as unknown as Feedback)}
                                            disabled={feedback.status === "RESPONDED"}
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(feedback.id)}
                                            disabled={feedback.status === "RESPONDED"}
                                            className="text-destructive hover:text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <p className="text-muted-foreground line-clamp-2">{feedback.commentSnippet}</p>
                                <div className="flex justify-between items-center mt-3 text-xs text-muted-foreground">
                                    <span>Order #{feedback.orderId}</span>
                                    <span>{formatDate(feedback.createdAt)}</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

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
                </div>
            )}

            {/* Feedback Detail Dialog */}
            <Dialog open={!!selectedFeedback} onOpenChange={() => setSelectedFeedback(null)}>
                <DialogContent className="max-w-2xl">
                    {selectedFeedback && (
                        <>
                            <DialogHeader>
                                <DialogTitle>Feedback Details</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <RatingStars rating={selectedFeedback.rating} size="lg" />
                                        <Badge variant={STATUS_VARIANTS[selectedFeedback.status] as any} className="mt-2">
                                            {selectedFeedback.status}
                                        </Badge>
                                    </div>
                                    <Badge variant="outline">{CATEGORY_LABELS[selectedFeedback.category]}</Badge>
                                </div>

                                <div>
                                    <Label className="text-muted-foreground">Order ID</Label>
                                    <p className="font-medium">#{selectedFeedback.orderId}</p>
                                </div>

                                <div>
                                    <Label className="text-muted-foreground">Comment</Label>
                                    <p className="mt-1 whitespace-pre-wrap">{selectedFeedback.comment}</p>
                                </div>

                                {selectedFeedback.staffResponse && (
                                    <div className="bg-muted p-4 rounded-lg">
                                        <Label className="text-muted-foreground flex items-center gap-2">
                                            <MessageSquare className="h-4 w-4" />
                                            Staff Response
                                        </Label>
                                        <p className="mt-2">{selectedFeedback.staffResponse}</p>
                                        {selectedFeedback.respondedAt && (
                                            <p className="text-xs text-muted-foreground mt-2">
                                                {formatDate(selectedFeedback.respondedAt)}
                                            </p>
                                        )}
                                    </div>
                                )}

                                <div className="text-xs text-muted-foreground">
                                    Submitted on {formatDate(selectedFeedback.createdAt)}
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}