import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { requireUserId } from "~/lib/auth/auth.server";
import { 
  Upload, 
  X, 
  Plus,
  Save,
  Eye
} from "lucide-react";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserId(request);
  return json({});
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await formData(request);
  
  // Validate and create tour
  // This is mock - replace with actual database logic
  
  return redirect("/tour-guide/tours");
}

export default function NewTour() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [images, setImages] = useState<string[]>([]);
  const [includedItems, setIncludedItems] = useState<string[]>([""]);
  const [excludedItems, setExcludedItems] = useState<string[]>([""]);
  const [requirements, setRequirements] = useState<string[]>([""]);
  const [itinerary, setItinerary] = useState<{day: number; title: string; description: string}[]>([
    { day: 1, title: "", description: "" }
  ]);

  const addIncludedItem = () => setIncludedItems([...includedItems, ""]);
  const removeIncludedItem = (index: number) => setIncludedItems(includedItems.filter((_, i) => i !== index));
  const updateIncludedItem = (index: number, value: string) => {
    const updated = [...includedItems];
    updated[index] = value;
    setIncludedItems(updated);
  };

  const addExcludedItem = () => setExcludedItems([...excludedItems, ""]);
  const removeExcludedItem = (index: number) => setExcludedItems(excludedItems.filter((_, i) => i !== index));
  const updateExcludedItem = (index: number, value: string) => {
    const updated = [...excludedItems];
    updated[index] = value;
    setExcludedItems(updated);
  };

  const addRequirement = () => setRequirements([...requirements, ""]);
  const removeRequirement = (index: number) => setRequirements(requirements.filter((_, i) => i !== index));
  const updateRequirement = (index: number, value: string) => {
    const updated = [...requirements];
    updated[index] = value;
    setRequirements(updated);
  };

  const addItineraryDay = () => {
    setItinerary([...itinerary, { day: itinerary.length + 1, title: "", description: "" }]);
  };

  const removeItineraryDay = (index: number) => {
    const updated = itinerary.filter((_, i) => i !== index);
    // Renumber days
    updated.forEach((item, i) => item.day = i + 1);
    setItinerary(updated);
  };

  const updateItineraryDay = (index: number, field: string, value: string) => {
    const updated = [...itinerary];
    updated[index] = { ...updated[index], [field]: value };
    setItinerary(updated);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create New Tour</h1>
          <p className="mt-2 text-sm text-gray-600">
            Fill in the details to create your tour package
          </p>
        </div>

        <Form method="post" className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Tour Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                  placeholder="e.g., K2 Base Camp Trek - 15 Days Adventure"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  required
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                  placeholder="Describe your tour in detail..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                    Location *
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                    placeholder="e.g., Skardu"
                  />
                </div>

                <div>
                  <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty Level *
                  </label>
                  <select
                    id="difficulty"
                    name="difficulty"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                  >
                    <option value="">Select difficulty</option>
                    <option value="Easy">Easy</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Hard">Hard</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing & Group Size */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Pricing & Group Size</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="pricePerPerson" className="block text-sm font-medium text-gray-700 mb-2">
                  Price Per Person (PKR) *
                </label>
                <input
                  type="number"
                  id="pricePerPerson"
                  name="pricePerPerson"
                  required
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                  placeholder="5000"
                />
              </div>

              <div>
                <label htmlFor="minGroupSize" className="block text-sm font-medium text-gray-700 mb-2">
                  Min Group Size *
                </label>
                <input
                  type="number"
                  id="minGroupSize"
                  name="minGroupSize"
                  required
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                  placeholder="2"
                />
              </div>

              <div>
                <label htmlFor="maxGroupSize" className="block text-sm font-medium text-gray-700 mb-2">
                  Max Group Size *
                </label>
                <input
                  type="number"
                  id="maxGroupSize"
                  name="maxGroupSize"
                  required
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                  placeholder="10"
                />
              </div>
            </div>

            <div className="mt-6">
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                Duration (hours) *
              </label>
              <input
                type="number"
                id="duration"
                name="duration"
                required
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                placeholder="8"
              />
              <p className="mt-1 text-sm text-gray-500">For multi-day tours, enter total hours (e.g., 72 for 3 days)</p>
            </div>
          </div>

          {/* Languages */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Languages Offered</h2>
            
            <div className="space-y-3">
              <label className="flex items-center">
                <input type="checkbox" name="languages" value="English" className="h-4 w-4 text-[#01502E] focus:ring-[#01502E] border-gray-300 rounded" />
                <span className="ml-2 text-sm text-gray-700">English</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" name="languages" value="Urdu" className="h-4 w-4 text-[#01502E] focus:ring-[#01502E] border-gray-300 rounded" />
                <span className="ml-2 text-sm text-gray-700">Urdu</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" name="languages" value="Balti" className="h-4 w-4 text-[#01502E] focus:ring-[#01502E] border-gray-300 rounded" />
                <span className="ml-2 text-sm text-gray-700">Balti</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" name="languages" value="Shina" className="h-4 w-4 text-[#01502E] focus:ring-[#01502E] border-gray-300 rounded" />
                <span className="ml-2 text-sm text-gray-700">Shina</span>
              </label>
            </div>
          </div>

          {/* What's Included */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">What's Included</h2>
            
            <div className="space-y-3">
              {includedItems.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => updateIncludedItem(index, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                    placeholder="e.g., Professional guide, Transportation, Meals"
                  />
                  {includedItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeIncludedItem(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addIncludedItem}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-[#01502E] hover:bg-gray-50 rounded-lg transition"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </button>
            </div>
          </div>

          {/* What's Excluded */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">What's Not Included</h2>
            
            <div className="space-y-3">
              {excludedItems.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => updateExcludedItem(index, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                    placeholder="e.g., Personal expenses, Travel insurance"
                  />
                  {excludedItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeExcludedItem(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addExcludedItem}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-[#01502E] hover:bg-gray-50 rounded-lg transition"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </button>
            </div>
          </div>

          {/* Requirements */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Guest Requirements</h2>
            
            <div className="space-y-3">
              {requirements.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => updateRequirement(index, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                    placeholder="e.g., Moderate fitness level, Hiking boots, Warm clothing"
                  />
                  {requirements.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRequirement(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addRequirement}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-[#01502E] hover:bg-gray-50 rounded-lg transition"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Requirement
              </button>
            </div>
          </div>

          {/* Itinerary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Tour Itinerary</h2>
            
            <div className="space-y-6">
              {itinerary.map((day, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Day {day.day}</h3>
                    {itinerary.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItineraryDay(index)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={day.title}
                      onChange={(e) => updateItineraryDay(index, "title", e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                      placeholder="Day title (e.g., Arrival in Skardu)"
                    />
                    <textarea
                      value={day.description}
                      onChange={(e) => updateItineraryDay(index, "description", e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                      placeholder="Describe what happens on this day..."
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addItineraryDay}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-[#01502E] hover:bg-gray-50 rounded-lg transition"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Day
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-[#01502E] text-white rounded-lg hover:bg-[#013d23] transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Create Tour
                </>
              )}
            </button>
            <button
              type="button"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              <Eye className="h-5 w-5 mr-2 inline" />
              Preview
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}

