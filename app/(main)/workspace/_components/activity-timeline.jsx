import { formatDistanceToNow } from "date-fns";
import { 
  FileText, 
  MessageSquare, 
  Pin, 
  FolderKanban, 
  Trash2, 
  Edit, 
  Plus 
} from "lucide-react";

const getActivityIcon = (type) => {
  switch (type) {
    case "CREATED":
      return <FolderKanban className="h-4 w-4 text-emerald-500" />;
    case "UPDATED":
      return <Edit className="h-4 w-4 text-blue-500" />;
    case "NOTE_ADDED":
      return <MessageSquare className="h-4 w-4 text-purple-500" />;
    case "NOTE_UPDATED":
      return <Edit className="h-4 w-4 text-blue-500" />;
    case "NOTE_DELETED":
      return <Trash2 className="h-4 w-4 text-red-500" />;
    case "PIN_TOGGLED":
      return <Pin className="h-4 w-4 text-amber-500" />;
    case "AGENT_OUTPUT_SAVED":
      return <FileText className="h-4 w-4 text-indigo-500" />;
    default:
      return <Plus className="h-4 w-4 text-muted-foreground" />;
  }
};

export function ActivityTimeline({ activities = [] }) {
  if (activities.length === 0) {
    return (
      <div className="text-center p-6 text-sm text-muted-foreground border rounded-xl border-dashed">
        No recent activity.
      </div>
    );
  }

  return (
    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
      {activities.map((activity, index) => (
        <div key={activity.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
          {/* Icon */}
          <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-background bg-muted text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 relative">
            {getActivityIcon(activity.type)}
          </div>
          
          {/* Card */}
          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-card border p-4 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-sm text-foreground capitalize">
                {activity.type.replace(/_/g, " ").toLowerCase()}
              </span>
              <time className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
              </time>
            </div>
            <div className="text-sm text-muted-foreground">
              {activity.description}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
