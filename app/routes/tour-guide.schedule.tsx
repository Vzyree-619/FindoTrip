import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData, useNavigation } from "@remix-run/react";
import { requireUserId } from "~/lib/auth/auth.server";
import { 
  Calendar as CalendarIcon,
  Clock,
  Plus,
  X,
  Save,
  AlertTriangle
} from "lucide-react";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  
  // Mock data - replace with actual database queries
  const availability = [
    {
      id: "1",
      date: "2025-10-15",
      startTime: "08:00",
      endTime: "18:00",
      isAvailable: true,
      isBlocked: false
    },
    {
      id: "2",
      date: "2025-10-20",
      startTime: "09:00",
      endTime: "17:00",
      isAvailable: false,
      isBlocked: true,
      blockReason: "Personal event"
    }
  ];

  const blackoutDates = [
    {
      id: "1",
      startDate: "2025-12-20",
      endDate: "2025-12-31",
      reason: "Year-end vacation"
    }
  ];

  return json({ availability, blackoutDates });
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  
  // Handle availability update logic here
  
  return json({ success: true });
}

export default function ScheduleManagement() {
  const { availability, blackoutDates } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [timeSlots, setTimeSlots] = useState([
    { startTime: "09:00", endTime: "17:00" }
  ]);
  const [blackouts, setBlackouts] = useState(blackoutDates);

  const addTimeSlot = () => {
    setTimeSlots([...timeSlots, { startTime: "09:00", endTime: "17:00" }]);
  };

  const removeTimeSlot = (index: number) => {
    setTimeSlots(timeSlots.filter((_, i) => i !== index));
  };

  const updateTimeSlot = (index: number, field: string, value: string) => {
    const updated = [...timeSlots];
    updated[index] = { ...updated[index], [field]: value };
    setTimeSlots(updated);
  };

  const addBlackout = () => {
    setBlackouts([...blackouts, { 
      id: Date.now().toString(), 
      startDate: "", 
      endDate: "", 
      reason: "" 
    }]);
  };

  const removeBlackout = (id: string) => {
    setBlackouts(blackouts.filter(b => b.id !== id));
  };

  const updateBlackout = (id: string, field: string, value: string) => {
    setBlackouts(blackouts.map(b =>
      b.id === id ? { ...b, [field]: value } : b
    ));
  };

  // Get current month's calendar
  const currentMonth = new Date();
  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay();

  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => null);

  const getDateAvailability = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
      .toISOString().split('T')[0];
    return availability.find(a => a.date === date);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Schedule & Availability</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your availability and set blackout dates
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar View */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {emptyDays.map((_, index) => (
                  <div key={`empty-${index}`} className="aspect-square"></div>
                ))}
                {calendarDays.map(day => {
                  const availability = getDateAvailability(day);
                  return (
                    <button
                      key={day}
                      onClick={() => {
                        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
                          .toISOString().split('T')[0];
                        setSelectedDate(date);
                      }}
                      className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition ${
                        availability?.isBlocked
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : availability?.isAvailable
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center text-sm">
                  <div className="w-4 h-4 bg-green-100 rounded mr-2"></div>
                  <span className="text-gray-600">Available</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-4 h-4 bg-red-100 rounded mr-2"></div>
                  <span className="text-gray-600">Blocked</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-4 h-4 bg-gray-50 rounded mr-2"></div>
                  <span className="text-gray-600">Not Set</span>
                </div>
              </div>
            </div>

            {/* Blackout Dates */}
            <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-6">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Blackout Dates</h2>
              </div>

              <div className="space-y-4">
                {blackouts.map((blackout, index) => (
                  <div key={blackout.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">Blackout Period {index + 1}</h3>
                      {blackouts.length > 0 && (
                        <button
                          type="button"
                          onClick={() => removeBlackout(blackout.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={blackout.startDate}
                          onChange={(e) => updateBlackout(blackout.id, "startDate", e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={blackout.endDate}
                          onChange={(e) => updateBlackout(blackout.id, "endDate", e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Reason
                        </label>
                        <input
                          type="text"
                          value={blackout.reason}
                          onChange={(e) => updateBlackout(blackout.id, "reason", e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                          placeholder="e.g., Vacation, Personal event"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addBlackout}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-[#01502E] hover:bg-gray-50 rounded-lg transition"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Blackout Period
                </button>
              </div>
            </div>
          </div>

          {/* Daily Availability Editor */}
          <div className="space-y-6">
            <Form method="post" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-6">
                <Clock className="h-5 w-5 text-[#01502E] mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Set Availability</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Time Slots
                  </label>
                  {timeSlots.map((slot, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => updateTimeSlot(index, "startTime", e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                      />
                      <span className="text-gray-500">to</span>
                      <input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => updateTimeSlot(index, "endTime", e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                      />
                      {timeSlots.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTimeSlot(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addTimeSlot}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-[#01502E] hover:bg-gray-50 rounded-lg transition"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Time Slot
                  </button>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="isAvailable"
                      defaultChecked
                      className="h-4 w-4 text-[#01502E] focus:ring-[#01502E] border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Mark as Available</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center px-6 py-3 bg-[#01502E] text-white rounded-lg hover:bg-[#013d23] transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5 mr-2" />
                      Save Availability
                    </>
                  )}
                </button>
              </div>
            </Form>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium">
                  Set Weekly Recurring Schedule
                </button>
                <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium">
                  Copy Last Week's Schedule
                </button>
                <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium">
                  Block Entire Week
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

