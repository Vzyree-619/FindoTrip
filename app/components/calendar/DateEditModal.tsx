import * as React from "react";
import { format, eachDayOfInterval } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "~/components/ui/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { RadioGroup, RadioGroupItem } from "~/components/ui/ui/radio-group";
import { Checkbox } from "~/components/ui/checkbox";
import type { DateInfo } from "./RoomCalendar";

interface DateEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dates: Date[];
  roomName: string;
  basePrice: number;
  currency: string;
  initialData?: Map<string, Partial<DateInfo>>;
  onSave: (data: {
    dates: Date[];
    price?: number;
    useBasePrice: boolean;
    isBlocked: boolean;
    blockReason?: string;
    notes?: string;
    minStay?: number;
    maxStay?: number;
    applyToPattern?: "only-dates" | "weekdays" | "weekends" | "recurring";
  }) => void;
}

export function DateEditModal({
  open,
  onOpenChange,
  dates,
  roomName,
  basePrice,
  currency,
  initialData,
  onSave,
}: DateEditModalProps) {
  const [useBasePrice, setUseBasePrice] = React.useState(true);
  const [customPrice, setCustomPrice] = React.useState<string>(basePrice.toString());
  const [isBlocked, setIsBlocked] = React.useState(false);
  const [blockReason, setBlockReason] = React.useState<string>("");
  const [notes, setNotes] = React.useState<string>("");
  const [minStay, setMinStay] = React.useState<string>("");
  const [maxStay, setMaxStay] = React.useState<string>("");
  const [applyToPattern, setApplyToPattern] = React.useState<"only-dates" | "weekdays" | "weekends" | "recurring">("only-dates");
  const [selectedDays, setSelectedDays] = React.useState<number[]>([]);

  React.useEffect(() => {
    if (open && dates.length > 0 && initialData) {
      // Load initial data from first date
      const firstDateKey = format(dates[0], "yyyy-MM-dd");
      const firstData = initialData.get(firstDateKey);
      
      if (firstData) {
        setUseBasePrice(firstData.price === firstData.basePrice);
        setCustomPrice(firstData.price?.toString() || basePrice.toString());
        setIsBlocked(firstData.isBlocked || false);
        setBlockReason(firstData.blockReason || "");
        setMinStay(firstData.minStay?.toString() || "");
        setMaxStay(firstData.maxStay?.toString() || "");
      }
    }
  }, [open, dates, initialData, basePrice]);

  const handleSave = () => {
    const price = useBasePrice ? undefined : parseFloat(customPrice);
    
    onSave({
      dates,
      price,
      useBasePrice,
      isBlocked,
      blockReason: isBlocked ? blockReason : undefined,
      notes: notes || undefined,
      minStay: minStay ? parseInt(minStay) : undefined,
      maxStay: maxStay ? parseInt(maxStay) : undefined,
      applyToPattern,
    });
    
    onOpenChange(false);
  };

  const dateRangeText = dates.length === 1
    ? format(dates[0], "MMMM d, yyyy")
    : `${format(dates[0], "MMM d")} - ${format(dates[dates.length - 1], "MMM d, yyyy")} (${dates.length} nights)`;

  const previewDates = dates.slice(0, 3);
  const previewPrice = useBasePrice ? basePrice : parseFloat(customPrice) || basePrice;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle>EDIT DATE(S): {dateRangeText}</DialogTitle>
          <DialogDescription>Room: {roomName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* PRICING */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 border-b pb-2">PRICING</h3>
            <div className="text-sm text-gray-600 mb-4">
              Current Base Price: {currency} {basePrice.toLocaleString()}/night
            </div>

            <RadioGroup value={useBasePrice ? "base" : "custom"} onValueChange={(value) => setUseBasePrice(value === "base")}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="base" id="base-price" />
                <Label htmlFor="base-price" className="cursor-pointer">Use Base Price</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="custom-price" />
                <Label htmlFor="custom-price" className="cursor-pointer">Set Custom Price:</Label>
                <Input
                  type="number"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  disabled={useBasePrice}
                  className="w-32 ml-2"
                  min="0"
                  step="0.01"
                />
                <span className="text-sm text-gray-600">per night</span>
              </div>
            </RadioGroup>

            <div className="mt-4">
              <Label className="text-sm font-medium mb-2 block">Apply price change:</Label>
              <RadioGroup value={applyToPattern} onValueChange={(value) => setApplyToPattern(value as any)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="only-dates" id="only-dates" />
                  <Label htmlFor="only-dates" className="cursor-pointer">Only these dates</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="weekdays" id="weekdays" />
                  <Label htmlFor="weekdays" className="cursor-pointer">These dates + every Friday/Saturday</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="recurring" id="recurring" />
                  <Label htmlFor="recurring" className="cursor-pointer">Same dates every month (recurring)</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* AVAILABILITY */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 border-b pb-2">AVAILABILITY</h3>
            <RadioGroup value={isBlocked ? "blocked" : "available"} onValueChange={(value) => setIsBlocked(value === "blocked")}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="available" id="available" />
                <Label htmlFor="available" className="cursor-pointer">Available for Booking</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="blocked" id="blocked" />
                <Label htmlFor="blocked" className="cursor-pointer">Block These Dates</Label>
              </div>
            </RadioGroup>

            {isBlocked && (
              <div className="ml-6 space-y-2">
                <Label className="text-sm font-medium">If blocking, select reason:</Label>
                <Select value={blockReason} onValueChange={setBlockReason}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maintenance">Maintenance/Repairs</SelectItem>
                    <SelectItem value="personal">Personal Use</SelectItem>
                    <SelectItem value="closed">Property Closed</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* BOOKING RESTRICTIONS */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 border-b pb-2">BOOKING RESTRICTIONS</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="min-stay" className="text-sm font-medium">Minimum Stay:</Label>
                <Input
                  id="min-stay"
                  type="number"
                  value={minStay}
                  onChange={(e) => setMinStay(e.target.value)}
                  placeholder="nights (leave blank for no minimum)"
                  min="0"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="max-stay" className="text-sm font-medium">Maximum Stay:</Label>
                <Input
                  id="max-stay"
                  type="number"
                  value={maxStay}
                  onChange={(e) => setMaxStay(e.target.value)}
                  placeholder="nights (leave blank for no maximum)"
                  min="0"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* NOTES */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">Notes (optional):</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes about these dates..."
              rows={3}
            />
          </div>

          {/* PREVIEW */}
          <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 border-b pb-2">PREVIEW</h3>
            <div className="space-y-2">
              {previewDates.map((date) => (
                <div key={format(date, "yyyy-MM-dd")} className="text-sm">
                  <span className="font-medium">{format(date, "MMMM d, yyyy")}:</span>{" "}
                  <span className={previewPrice !== basePrice ? "text-purple-700 font-semibold" : ""}>
                    {currency} {previewPrice.toLocaleString()}/night
                  </span>
                  {previewPrice !== basePrice && (
                    <span className="text-gray-500 ml-1">
                      (was {currency} {basePrice.toLocaleString()})
                    </span>
                  )}{" "}
                  <span className="text-green-600">✓ Available</span>
                </div>
              ))}
              {dates.length > 3 && (
                <div className="text-sm text-gray-500">
                  ... and {dates.length - 3} more date{dates.length - 3 !== 1 ? "s" : ""}
                </div>
              )}
            </div>
            <div className="text-sm text-gray-600 mt-2">
              This change affects {dates.length} date{dates.length !== 1 ? "s" : ""} for 1 room type.
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            CANCEL
          </Button>
          <Button onClick={handleSave} className="bg-[#01502E] hover:bg-[#013d23]">
            SAVE CHANGES
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

