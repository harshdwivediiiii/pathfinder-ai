"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  Bookmark,
  ExternalLink,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { BOOKMARK_CATEGORIES } from "@/lib/schemas/forms";
import { deleteBookmark } from "@/actions/bookmark";

export default function BookmarksClient({ initialBookmarks = [] }) {
  const [bookmarks, setBookmarks] = useState(initialBookmarks);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isPending, startTransition] = useTransition();

  const filteredBookmarks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return bookmarks.filter((bookmark) => {
      const matchesSearch =
        !query ||
        bookmark.title?.toLowerCase().includes(query) ||
        bookmark.notes?.toLowerCase().includes(query);

      const matchesCategory =
        selectedCategory === "All" ||
        bookmark.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [bookmarks, search, selectedCategory]);

  const handleDelete = (id) => {
    startTransition(async () => {
      const result = await deleteBookmark(id);

      if (result?.success) {
        setBookmarks((current) =>
          current.filter((bookmark) => bookmark.id !== id)
        );
      }
    });
  };

  const clearSearch = () => {
    setSearch("");
  };

  return (
    <div className="space-y-6">
      {/* Search and filter */}
      <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-soft">
        <div className="flex flex-col gap-4 md:flex-row">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              aria-hidden="true"
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search your bookmarks..."
              aria-label="Search bookmarks"
              className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-10 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />

            {search && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Clear search"
                title="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Category */}
          <select
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
            aria-label="Filter bookmarks by category"
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="All">All Categories</option>

            {BOOKMARK_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results count */}
      {bookmarks.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {filteredBookmarks.length}{" "}
            {filteredBookmarks.length === 1 ? "bookmark" : "bookmarks"}
          </span>

          {(search || selectedCategory !== "All") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSelectedCategory("All");
              }}
              className="text-primary hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Empty state */}
      {bookmarks.length === 0 ? (
        <EmptyState
          title="No bookmarks yet"
          description="Save useful interview questions, roadmaps, and AI-generated resources to find them quickly later."
        />
      ) : filteredBookmarks.length === 0 ? (
        <EmptyState
          title="No matching bookmarks"
          description="Try a different search term or category."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBookmarks.map((bookmark) => (
            <BookmarkCard
              key={bookmark.id}
              bookmark={bookmark}
              onDelete={handleDelete}
              isPending={isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Individual bookmark card.
 */
function BookmarkCard({ bookmark, onDelete, isPending }) {
  return (
    <article className="group rounded-2xl border border-border/50 bg-card p-5 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        {/* Icon */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Bookmark className="h-5 w-5" aria-hidden="true" />
        </div>

        {/* Delete */}
        <button
          type="button"
          onClick={() => onDelete(bookmark.id)}
          disabled={isPending}
          aria-label={`Delete bookmark ${bookmark.title}`}
          title="Delete bookmark"
          className="rounded-lg p-2 text-muted-foreground opacity-70 transition hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* Content */}
      <div className="mt-4 space-y-3">
        <div>
          <h2 className="line-clamp-2 font-semibold leading-tight">
            {bookmark.title}
          </h2>

          {bookmark.category && (
            <span className="mt-2 inline-flex rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
              {bookmark.category}
            </span>
          )}
        </div>

        {bookmark.notes && (
          <p className="line-clamp-3 text-sm text-muted-foreground">
            {bookmark.notes}
          </p>
        )}

        {/* Resource link */}
        {bookmark.url && (
          <Link
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex max-w-full items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <span className="truncate">Open resource</span>
            <ExternalLink
              className="h-4 w-4 shrink-0"
              aria-hidden="true"
            />
          </Link>
        )}

        {/* Date */}
        {bookmark.createdAt && (
          <p className="text-xs text-muted-foreground">
            Saved{" "}
            {new Date(bookmark.createdAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
        )}
      </div>
    </article>
  );
}

/**
 * Reusable empty state.
 */
function EmptyState({ title, description }) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-6 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Bookmark className="h-7 w-7" aria-hidden="true" />
      </div>

      <h2 className="text-lg font-semibold">{title}</h2>

      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {description}
      </p>
    </div>
  );
}