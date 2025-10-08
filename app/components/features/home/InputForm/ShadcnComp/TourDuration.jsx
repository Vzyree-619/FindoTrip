import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Check, ChevronDown} from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";

const workspaces = [
  { id: 1, Days: "Tour Duration" },
  { id: 2, Days: "3 Days" },
  { id: 3, Days: "7 Days" },
  { id: 4, Days: "10 Days" },
];

function TourDuration() {
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [customDays, setCustomDays] = useState("");

  const handleCustomAdd = () => {
    if (customDays.trim()) {
      setSelectedWorkspace({ id: 999, Days: `${customDays} Days` });
      setCustomDays("");
    }
  };

  return (
   
      <DropdownMenu>
        <DropdownMenuTrigger className="flex h-14 lg:h-auto text-left items-center space-x-16 justify-between py-2.5 px-3 outline-none border-[#f97316] border-r border-b">
          <div className="text-start flex flex-col gap-1 leading-none">
            <span className="text-sm leading-none font-normal  truncate max-w-[17ch]">
              {selectedWorkspace?.Days || "Tour Duration"}
            </span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-52 p-1 space-y-1" align="start">
          {workspaces.map((workspace) => (
            <DropdownMenuItem
              key={workspace.id}
              onClick={() => {
                if (workspace.id !== 1) setSelectedWorkspace(workspace);
              }}
              disabled={workspace.id === 1}
            >
              <span>{workspace.Days}</span>
              {selectedWorkspace?.id === workspace.id && (
                <Check className="ml-auto" />
              )}
            </DropdownMenuItem>
          ))}

          <div className="px-2 py-1 border-t border-muted">
            <input
              type="number"
              min={1}
              placeholder="Enter days"
              className="h-8 text-sm outline-none"
              value={customDays}
              onChange={(e) => setCustomDays(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCustomAdd();
              }}
            />
            <button
              className="w-full mt-1 bg-primary text-white text-sm rounded px-2 py-1 hover:bg-primary/90"
              onClick={handleCustomAdd}
            >
              Add Custom Days
            </button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
  );
}

function Guests() {
  const [adults, setAdults] = useState(1);
  const [childs, setChilds] = useState(0);
  const [room, setRoom] = useState(1);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex h-16  lg:h-auto text-left items-center  lg:space-x-16 justify-between py-1.5 px-3  md:py-2.5 md:px-3.5  lg:py-2.5 lg:px-3 outline-none border-[#f97316] border-r border-b">
        <div className="flex md:gap-1 lg:gap-2 font-normal text-sm ">
          <span>{adults} Adults -</span>
          <span> {childs} Child -</span>
          <span>{room} Room</span>
        </div>
        <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-64 p-3 space-y-3" align="start">
        {/* Adults */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Adults</span>
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              onClick={() => setAdults((prev) => Math.max(1, prev - 1))}
            >
              -
            </Button>
            <span>{adults}</span>
            <Button size="icon" onClick={() => setAdults((prev) => prev + 1)}>
              +
            </Button>
          </div>
        </div>

        {/* Childs */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Childs</span>
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              onClick={() => setChilds((prev) => Math.max(0, prev - 1))}
            >
              -
            </Button>
            <span>{childs}</span>
            <Button size="icon" onClick={() => setChilds((prev) => prev + 1)}>
              +
            </Button>
          </div>
        </div>

        {/* Rooms */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Rooms</span>
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              onClick={() => setRoom((prev) => Math.max(1, prev - 1))}
            >
              -
            </Button>
            <span>{room}</span>
            <Button size="icon" onClick={() => setRoom((prev) => prev + 1)}>
              +
            </Button>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const activityTypes = [
  { id: 1, type: "Adventure" },
  { id: 2, type: "Culture" },
  { id: 3, type: "Nature" },
  { id: 4, type: "Sports" },
];

function ActivityTypes() {
  const [selectedActivity, setSelectedActivity] = useState(null);

  return (
    
      <DropdownMenu>
        <DropdownMenuTrigger className="flex h-16 lg:h-auto text-left items-center space-x-16 justify-between py-2.5 px-3 outline-none border-[#f97316] border-r border-b">
            <span className="text-sm leading-none font-normal max-w-[17ch]">
              {selectedActivity?.type || "Activity Type"}
            </span>

          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-52 p-1 space-y-1" align="start">
          {activityTypes.map((activity) => (
            <DropdownMenuItem
              key={activity.id}
              onClick={() => {
                setSelectedActivity(activity);
              }}
            >
              <span>{activity.type}</span>
              {selectedActivity?.id === activity.id && (
                <Check className="ml-auto" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
  );
}

const groupSize = [
  { id: 1, size: "Individual" },
  { id: 2, size: "Small Group (2-5)" },
  { id: 3, size: "Medium Group (6-10)" },
  { id: 4, size: "Large Group(10+)" },
];

function GroupSize() {
  const [selectedGroup, setSelectedGroup] = useState(null);

  return (
    
      <DropdownMenu>
        <DropdownMenuTrigger className="flex h-16 lg:h-auto text-left items-center space-x-16 justify-between py-2.5 px-3 outline-none border-[#f97316] border-r border-b">
          <div className="text-start flex flex-col gap-1 leading-none">
            <span className="text-sm leading-none font-normal truncate max-w-[17ch]">
              {selectedGroup?.size || "Group Size"}
            </span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-52 p-1 space-y-1" align="start">
          {groupSize.map((group) => (
            <DropdownMenuItem
              key={group.id}
              onClick={() => {
                setSelectedGroup(group);
              }}
            >
              <span>{group.size}</span>
              {selectedGroup?.id === group.id && <Check className="ml-auto" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
 
  );
}

export { Guests, ActivityTypes, GroupSize };

export default TourDuration;
