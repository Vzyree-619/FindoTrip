import * as React from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/ui/dialog";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { DollarSign, Ban, CheckCircle, Calendar, Copy, TrendingUp } from "lucide-react";
import { cn } from "~/lib/utils";

interface BulkEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dates: Date[];
  onActionSelect: (action: BulkAction) => void;
}

export type BulkAction =
  | "set-price"
  | "adjust-price"
  | "block"
  | "unblock"
  | "set-min-stay"
  | "copy-settings";

export function BulkEditModal({
  open,
  onOpenChange,
  dates,
  onActionSelect,
}: BulkEditModalProps) {
  const dateRangeText = dates.length === 1
    ? format(dates[0], "MMMM d, yyyy")
    : `${format(dates[0], "MMM d")} - ${format(dates[dates.length - 1], "MMM d, yyyy")}`;

  const actions: Array<{
    id: BulkAction;
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
  }> = [
    {
      id: "set-price",
      title: "Set Custom Price",
      description: "Apply the same price to all selected dates",
      icon: <DollarSign className="w-5 h-5" />,
      color: "bg-blue-50 hover:bg-blue-100 border-blue-200",
    },
    {
      id: "adjust-price",
      title: "Adjust Price by Percentage",
      description: "Increase or decrease current prices by a percentage",
      icon: <TrendingUp className="w-5 h-5" />,
      color: "bg-green-50 hover:bg-green-100 border-green-200",
    },
    {
      id: "block",
      title: "Block All Dates",
      description: "Make all selected dates unavailable for booking",
      icon: <Ban className="w-5 h-5" />,
      color: "bg-red-50 hover:bg-red-100 border-red-200",
    },
    {
      id: "unblock",
      title: "Unblock All Dates",
      description: "Make all selected dates available for booking",
      icon: <CheckCircle className="w-5 h-5" />,
      color: "bg-green-50 hover:bg-green-100 border-green-200",
    },
    {
      id: "set-min-stay",
      title: "Set Minimum Stay",
      description: "Apply minimum night requirement to selected dates",
      icon: <Calendar className="w-5 h-5" />,
      color: "bg-purple-50 hover:bg-purple-100 border-purple-200",
    },
    {
      id: "copy-settings",
      title: "Copy Settings From...",
      description: "Copy pricing/availability from another date range",
      icon: <Copy className="w-5 h-5" />,
      color: "bg-orange-50 hover:bg-orange-100 border-orange-200",
    },
  ];

  const handleActionClick = (action: BulkAction) => {
    onActionSelect(action);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>BULK EDIT: {dates.length} Dates Selected</DialogTitle>
          <p className="text-sm text-gray-600">{dateRangeText}</p>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <p className="text-sm font-medium text-gray-700 mb-4">SELECT ACTION:</p>
          
          {actions.map((action) => (
            <Card
              key={action.id}
              className={cn(
                "p-4 cursor-pointer transition-all border-2",
                action.color
              )}
              onClick={() => handleActionClick(action.id)}
            >
              <div className="flex items-start gap-4">
                <div className={cn(
                  "p-2 rounded-lg",
                  action.id === "set-price" ? "bg-blue-200" :
                  action.id === "adjust-price" ? "bg-green-200" :
                  action.id === "block" ? "bg-red-200" :
                  action.id === "unblock" ? "bg-green-200" :
                  action.id === "set-min-stay" ? "bg-purple-200" :
                  "bg-orange-200"
                )}>
                  {action.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {action.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            CANCEL
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


