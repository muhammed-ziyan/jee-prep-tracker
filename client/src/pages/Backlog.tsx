import { useState } from "react";
import { useBacklog, useCreateBacklog, useDeleteBacklog, useUpdateBacklog } from "@/hooks/use-backlog";
import { AlertCircle, Trash2, CheckCircle, Circle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function Backlog() {
  const { data: items, isLoading } = useBacklog();
  const createBacklog = useCreateBacklog();
  const updateBacklog = useUpdateBacklog();
  const deleteBacklog = useDeleteBacklog();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    title: "",
    description: "",
    priority: "medium",
    type: "concept",
    deadline: ""
  });

  const handleCreate = () => {
    createBacklog.mutate({
      title: newItem.title,
      description: newItem.description,
      priority: newItem.priority as "low" | "medium" | "high",
      type: newItem.type as "concept" | "practice" | "forgetting",
      deadline: newItem.deadline ? new Date(newItem.deadline).toISOString() : undefined,
    }, {
      onSuccess: () => {
        setIsCreateOpen(false);
        setNewItem({ title: "", description: "", priority: "medium", type: "concept", deadline: "" });
      }
    });
  };

  const toggleComplete = (id: number, currentStatus: boolean | null) => {
    updateBacklog.mutate({ id, isCompleted: !currentStatus });
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Backlog & Weak Areas</h1>
          <p className="text-muted-foreground mt-1">Prioritize and eliminate your weaknesses.</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-destructive hover:bg-destructive/90 text-white shadow-lg shadow-destructive/20">
              <Plus className="h-4 w-4" /> Add Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add to Backlog</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input 
                  value={newItem.title} 
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })} 
                  placeholder="e.g., Rotational Motion numericals"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={newItem.priority} onValueChange={(v) => setNewItem({ ...newItem, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={newItem.type} onValueChange={(v) => setNewItem({ ...newItem, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="concept">Concept Clarity</SelectItem>
                      <SelectItem value="practice">Practice Gap</SelectItem>
                      <SelectItem value="forgetting">Forgetting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea 
                  value={newItem.description} 
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <Label>Target Date (Optional)</Label>
                <Input 
                  type="date"
                  value={newItem.deadline} 
                  onChange={(e) => setNewItem({ ...newItem, deadline: e.target.value })} 
                />
              </div>
            </div>
            <Button onClick={handleCreate} disabled={!newItem.title || createBacklog.isPending} className="w-full">
              Add to Backlog
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items?.map((item) => (
          <div 
            key={item.id} 
            className={cn(
              "p-6 rounded-2xl border shadow-sm transition-all relative group bg-card",
              item.isCompleted ? "opacity-60 grayscale" : "hover:shadow-md hover:-translate-y-1"
            )}
          >
            <div className="flex justify-between items-start mb-4">
              <Badge 
                variant="outline" 
                className={cn(
                  "capitalize",
                  item.priority === "high" ? "bg-red-100 text-red-700 border-red-200" :
                  item.priority === "medium" ? "bg-orange-100 text-orange-700 border-orange-200" :
                  "bg-blue-100 text-blue-700 border-blue-200"
                )}
              >
                {item.priority} Priority
              </Badge>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground hover:text-destructive -mr-2"
                onClick={() => deleteBacklog.mutate(item.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            
            <h3 className={cn("text-lg font-bold mb-2", item.isCompleted && "line-through")}>{item.title}</h3>
            <p className="text-sm text-muted-foreground mb-6 line-clamp-3">{item.description}</p>
            
            <div className="flex items-center justify-between mt-auto">
              <Badge variant="secondary" className="capitalize bg-muted text-muted-foreground">
                {item.type}
              </Badge>
              
              <Button 
                size="sm"
                variant={item.isCompleted ? "outline" : "default"}
                className={cn("gap-2", item.isCompleted && "text-green-600 border-green-200")}
                onClick={() => toggleComplete(item.id, item.isCompleted)}
              >
                {item.isCompleted ? (
                  <><CheckCircle className="h-4 w-4" /> Done</>
                ) : (
                  <><Circle className="h-4 w-4" /> Mark Done</>
                )}
              </Button>
            </div>
            
            {item.deadline && (
              <div className="absolute top-0 right-0 p-3">
                 {/* Could show deadline badge here */}
              </div>
            )}
          </div>
        ))}
        
        {items?.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-border rounded-3xl bg-muted/10">
            <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold">All clear!</h3>
            <p className="text-muted-foreground mt-2">You have no backlog items. Great job!</p>
          </div>
        )}
      </div>
    </div>
  );
}
