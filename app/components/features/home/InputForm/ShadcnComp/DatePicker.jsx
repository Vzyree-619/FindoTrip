import { Popover, PopoverTrigger, PopoverContent } from "~/components/ui/popover";
import { Calendar } from "~/components/ui/calendar";
import { Button } from "~/components/ui/button";

import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

import PropTypes from "prop-types";

function DatePicker({ field }) {
  // Keep individual date states per field by name
  const [dates, setDates] = useState({});

  const handleDateChange = (fieldName, selectedDate) => {
    setDates((prev) => ({
      ...prev,
      [fieldName]: selectedDate,
    }));
  };
  return (
    <Popover>
      <PopoverTrigger className='flex gap-0 justify-start font-normal text-sm' asChild>
        <Button
          variant="destructive"
          className="w-[240px] justify-start text-left font-normal py-2 px-3 m-auto"
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
          {dates[field.name]
            ? format(dates[field.name], "PPP")
            : field.label || "Pick a date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-white">
        <Calendar
          mode="single"
          selected={dates[field.name]}
          onSelect={(date) => handleDateChange(field.name, date)}
          initialFocus
        />
      </PopoverContent>
      {/* Hidden input to submit selected date */}
      <input
        type="hidden"
        name={field.name}
        value={dates[field.name] ? format(dates[field.name], "yyyy-MM-dd") : ""}
      />
    </Popover>
  );
}
DatePicker.propTypes = {
  field: PropTypes.shape({
    name: PropTypes.string.isRequired,
    label: PropTypes.string,
    type: PropTypes.string,
    placeholder: PropTypes.string,
  }).isRequired,
};

export default DatePicker;
