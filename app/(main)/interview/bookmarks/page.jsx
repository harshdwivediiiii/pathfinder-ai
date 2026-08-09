"use client";

import { useState, useEffect, useCallback } from "react";
import { getBookmarks, removeBookmark } from "@/actions/bookmarks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, Trash2, ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

const CATEGORIES = ["All", "Technical", "Behavioral", "Situational"];

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [expandedId, setExpandedId] = useState(null);

  const fetchBookmarks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getBookmarks(category, search);
      setBookmarks(data);
    } catch (error) {
      toast.error("Failed to load bookmarks");
    } finally {
      setLoading(false);
    }
  }, [category, search]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchBookmarks();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [fetchBookmarks]);

  const handleRemove = async (id) => {
    try {
      await removeBookmark(id);
      setBookmarks((prev) => prev.filter((b) => b.id !== id));
      toast.success("Bookmark removed");
    } catch (error) {
      toast.error("Failed to remove bookmark");
    }
  };

  return (
    <div className="container mx-auto px-4 max-w-5xl py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/interview">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Saved Questions</h1>
          <p className="text-muted-foreground">Review and practice your bookmarked interview questions.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search questions..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : bookmarks.length === 0 ? (
        <Card className="py-12 text-center bg-muted/20">
          <CardContent>
            <p className="text-muted-foreground">No saved questions found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {bookmarks.map((bookmark) => (
            <Card key={bookmark.id} className="overflow-hidden">
              <CardHeader className="p-4 sm:p-6 pb-0">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <Badge variant="secondary" className="mb-2">
                      {bookmark.category}
                    </Badge>
                    <CardTitle className="text-lg leading-relaxed">{bookmark.question}</CardTitle>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleRemove(bookmark.id)}
                    className="text-muted-foreground hover:text-destructive shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="p-4 sm:p-6 pt-4">
                {bookmark.options && bookmark.options.length > 0 && (
                  <div className="mb-4 pl-4 border-l-2 border-muted space-y-2">
                    {bookmark.options.map((opt, i) => (
                      <p key={i} className="text-sm text-muted-foreground">{opt}</p>
                    ))}
                  </div>
                )}
                
                {bookmark.answer && (
                  <div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="px-0 flex items-center text-primary hover:text-primary hover:bg-transparent"
                      onClick={() => setExpandedId(expandedId === bookmark.id ? null : bookmark.id)}
                    >
                      {expandedId === bookmark.id ? (
                        <>Hide Explanation <ChevronUp className="ml-1 h-4 w-4" /></>
                      ) : (
                        <>Show Explanation <ChevronDown className="ml-1 h-4 w-4" /></>
                      )}
                    </Button>
                    
                    {expandedId === bookmark.id && (
                      <div className="mt-3 p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground leading-relaxed">
                        {bookmark.answer}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
