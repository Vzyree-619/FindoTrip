import { useState } from "react";
import { Plus, Edit, Trash2, Bed, Users, DollarSign, Image as ImageIcon } from "lucide-react";

interface Room {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  currency: string;
  maxOccupancy: number;
  adults: number;
  children: number;
  bedType: string;
  numberOfBeds: number;
  bedConfiguration: string;
  roomSize?: number;
  roomSizeUnit: string;
  floor?: string;
  view?: string;
  images: string[];
  mainImage?: string;
  amenities: string[];
  features: string[];
  totalUnits: number;
  available: boolean;
  weekendPrice?: number;
  discountPercent?: number;
  specialOffer?: string;
  smokingAllowed: boolean;
  petsAllowed: boolean;
}

interface RoomManagementProps {
  propertyId: string;
  rooms: Room[];
  onRoomAdded?: () => void;
  onRoomUpdated?: () => void;
  onRoomDeleted?: () => void;
}

export default function RoomManagement({
  propertyId,
  rooms: initialRooms,
  onRoomAdded,
  onRoomUpdated,
  onRoomDeleted
}: RoomManagementProps) {
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAddRoom = () => {
    setEditingRoom(null);
    setIsAddingRoom(true);
  };

  const handleEditRoom = (room: Room) => {
    setEditingRoom(room);
    setIsAddingRoom(true);
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm("Are you sure you want to delete this room type? This action cannot be undone.")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/properties/${propertyId}/rooms/${roomId}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete room");
      }

      setRooms(rooms.filter(r => r.id !== roomId));
      onRoomDeleted?.();
      alert("Room deleted successfully!");
    } catch (error: any) {
      alert(error.message || "Failed to delete room");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRoom = async (roomData: Partial<Room>) => {
    setLoading(true);
    try {
      const url = editingRoom
        ? `/api/properties/${propertyId}/rooms/${editingRoom.id}`
        : `/api/properties/${propertyId}/rooms`;
      
      const method = editingRoom ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(roomData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save room");
      }

      const { data: savedRoom } = await response.json();

      if (editingRoom) {
        setRooms(rooms.map(r => r.id === savedRoom.id ? savedRoom : r));
        onRoomUpdated?.();
      } else {
        setRooms([...rooms, savedRoom]);
        onRoomAdded?.();
      }

      setIsAddingRoom(false);
      setEditingRoom(null);
      alert("Room saved successfully!");
    } catch (error: any) {
      alert(error.message || "Failed to save room");
    } finally {
      setLoading(false);
    }
  };

  if (isAddingRoom) {
    return (
      <RoomForm
        room={editingRoom}
        onSave={handleSaveRoom}
        onCancel={() => {
          setIsAddingRoom(false);
          setEditingRoom(null);
        }}
        loading={loading}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Room Types</h2>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Manage different room types for your property
          </p>
        </div>
        <button
          onClick={handleAddRoom}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-[#01502E] text-white rounded-lg hover:bg-[#013d23] transition-colors text-sm sm:text-base"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          Add Room Type
        </button>
      </div>

      {rooms.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Bed className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No room types yet</h3>
          <p className="text-gray-600 mb-4">Start by adding your first room type</p>
          <button
            onClick={handleAddRoom}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#01502E] text-white rounded-lg hover:bg-[#013d23] transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Room Type
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map(room => (
            <div key={room.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
              {/* Room Image */}
              <div className="relative h-48 bg-gray-200">
                {room.mainImage || room.images[0] ? (
                  <img
                    src={room.mainImage || room.images[0]}
                    alt={room.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ImageIcon className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                {room.specialOffer && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-semibold">
                    {room.specialOffer}
                  </div>
                )}
                {!room.available && (
                  <div className="absolute top-2 left-2 bg-gray-500 text-white px-2 py-1 rounded text-sm">
                    Unavailable
                  </div>
                )}
              </div>

              {/* Room Details */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{room.name}</h3>
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">{room.description}</p>

                {/* Room Info */}
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Users className="w-4 h-4" />
                    <span>Up to {room.maxOccupancy} guests</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Bed className="w-4 h-4" />
                    <span>{room.bedConfiguration}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <DollarSign className="w-4 h-4" />
                    <span className="font-semibold text-[#01502E]">
                      {room.currency} {room.basePrice.toLocaleString()}/night
                    </span>
                  </div>
                </div>

                {/* Units Count */}
                <div className="text-sm text-gray-600 mb-4">
                  <span className="font-medium">{room.totalUnits}</span> unit{room.totalUnits !== 1 && 's'} available
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditRoom(room)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={loading}
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteRoom(room.id)}
                    className="flex items-center justify-center gap-2 px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    disabled={loading}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ========================================
// ROOM FORM COMPONENT
// ========================================

interface RoomFormProps {
  room?: Room | null;
  onSave: (data: Partial<Room>) => void;
  onCancel: () => void;
  loading: boolean;
}

function RoomForm({ room, onSave, onCancel, loading }: RoomFormProps) {
  const [formData, setFormData] = useState({
    name: room?.name || "",
    description: room?.description || "",
    basePrice: room?.basePrice || 0,
    currency: room?.currency || "PKR",
    maxOccupancy: room?.maxOccupancy || 2,
    adults: room?.adults || 2,
    children: room?.children || 0,
    bedType: room?.bedType || "King",
    numberOfBeds: room?.numberOfBeds || 1,
    bedConfiguration: room?.bedConfiguration || "1 King Bed",
    roomSize: room?.roomSize || null,
    roomSizeUnit: room?.roomSizeUnit || "sqm",
    floor: room?.floor || "",
    view: room?.view || "",
    images: room?.images || [],
    mainImage: room?.mainImage || "",
    amenities: room?.amenities || [],
    features: room?.features || [],
    totalUnits: room?.totalUnits || 1,
    available: room?.available ?? true,
    weekendPrice: room?.weekendPrice || null,
    discountPercent: room?.discountPercent || null,
    specialOffer: room?.specialOffer || "",
    smokingAllowed: room?.smokingAllowed || false,
    petsAllowed: room?.petsAllowed || false
  });

  const [newAmenity, setNewAmenity] = useState("");
  const [newFeature, setNewFeature] = useState("");
  const [newImage, setNewImage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const addAmenity = () => {
    if (newAmenity.trim()) {
      setFormData({ ...formData, amenities: [...formData.amenities, newAmenity.trim()] });
      setNewAmenity("");
    }
  };

  const removeAmenity = (index: number) => {
    setFormData({ ...formData, amenities: formData.amenities.filter((_, i) => i !== index) });
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData({ ...formData, features: [...formData.features, newFeature.trim()] });
      setNewFeature("");
    }
  };

  const removeFeature = (index: number) => {
    setFormData({ ...formData, features: formData.features.filter((_, i) => i !== index) });
  };

  const addImage = () => {
    if (newImage.trim()) {
      setFormData({ ...formData, images: [...formData.images, newImage.trim()] });
      setNewImage("");
    }
  };

  const removeImage = (index: number) => {
    setFormData({ ...formData, images: formData.images.filter((_, i) => i !== index) });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex justify-between items-center pb-4 border-b">
        <h2 className="text-2xl font-bold text-gray-900">
          {room ? "Edit Room Type" : "Add New Room Type"}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Room Name *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Deluxe King Room"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description *
          </label>
          <textarea
            required
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe the room..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Base Price *
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.basePrice}
              onChange={e => setFormData({ ...formData, basePrice: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Weekend Price
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.weekendPrice || ""}
              onChange={e => setFormData({ ...formData, weekendPrice: e.target.value ? parseFloat(e.target.value) : null })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Total Units *
          </label>
          <input
            type="number"
            required
            min="1"
            value={formData.totalUnits}
            onChange={e => setFormData({ ...formData, totalUnits: parseInt(e.target.value) })}
            placeholder="How many rooms of this type?"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
          />
        </div>
      </div>

      {/* Capacity */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Capacity</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Occupancy *
            </label>
            <input
              type="number"
              required
              min="1"
              value={formData.maxOccupancy}
              onChange={e => setFormData({ ...formData, maxOccupancy: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adults
            </label>
            <input
              type="number"
              min="1"
              value={formData.adults}
              onChange={e => setFormData({ ...formData, adults: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Children
            </label>
            <input
              type="number"
              min="0"
              value={formData.children}
              onChange={e => setFormData({ ...formData, children: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Bed Configuration */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Bed Configuration</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bed Type
            </label>
            <select
              value={formData.bedType}
              onChange={e => setFormData({ ...formData, bedType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
            >
              <option>King</option>
              <option>Queen</option>
              <option>Double</option>
              <option>Twin</option>
              <option>Single</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Beds
            </label>
            <input
              type="number"
              min="1"
              value={formData.numberOfBeds}
              onChange={e => setFormData({ ...formData, numberOfBeds: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bed Configuration
          </label>
          <input
            type="text"
            value={formData.bedConfiguration}
            onChange={e => setFormData({ ...formData, bedConfiguration: e.target.value })}
            placeholder="e.g., 1 King Bed or 2 Twin Beds"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
          />
        </div>
      </div>

      {/* Room Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Room Details</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Room Size
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                step="0.1"
                value={formData.roomSize || ""}
                onChange={e => setFormData({ ...formData, roomSize: e.target.value ? parseFloat(e.target.value) : null })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
              />
              <select
                value={formData.roomSizeUnit}
                onChange={e => setFormData({ ...formData, roomSizeUnit: e.target.value })}
                className="w-20 sm:w-24 px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent text-sm"
              >
                <option value="sqm">sqm</option>
                <option value="sqft">sqft</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Floor
            </label>
            <input
              type="text"
              value={formData.floor}
              onChange={e => setFormData({ ...formData, floor: e.target.value })}
              placeholder="e.g., 3rd Floor"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            View
          </label>
          <input
            type="text"
            value={formData.view}
            onChange={e => setFormData({ ...formData, view: e.target.value })}
            placeholder="e.g., Ocean View, City View"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
          />
        </div>
      </div>

      {/* Images */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Images</h3>
        
        <div className="flex gap-2">
          <input
            type="url"
            value={newImage}
            onChange={e => setNewImage(e.target.value)}
            placeholder="Enter image URL"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
          />
          <button
            type="button"
            onClick={addImage}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Add
          </button>
        </div>

        {formData.images.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.images.map((img, i) => (
              <div key={i} className="relative group">
                <img src={img} alt="" className="w-20 h-20 object-cover rounded" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Amenities */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Amenities</h3>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={newAmenity}
            onChange={e => setNewAmenity(e.target.value)}
            placeholder="e.g., Private Bathroom"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
          />
          <button
            type="button"
            onClick={addAmenity}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Add
          </button>
        </div>

        {formData.amenities.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.amenities.map((amenity, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full"
              >
                {amenity}
                <button
                  type="button"
                  onClick={() => removeAmenity(i)}
                  className="ml-1 text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Features */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Features</h3>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={newFeature}
            onChange={e => setNewFeature(e.target.value)}
            placeholder="e.g., Air Conditioning"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
          />
          <button
            type="button"
            onClick={addFeature}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Add
          </button>
        </div>

        {formData.features.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.features.map((feature, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full"
              >
                {feature}
                <button
                  type="button"
                  onClick={() => removeFeature(i)}
                  className="ml-1 text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Policies */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Policies</h3>
        
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.smokingAllowed}
              onChange={e => setFormData({ ...formData, smokingAllowed: e.target.checked })}
              className="w-4 h-4 text-[#01502E] rounded focus:ring-2 focus:ring-[#01502E]"
            />
            <span className="text-sm text-gray-700">Smoking Allowed</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.petsAllowed}
              onChange={e => setFormData({ ...formData, petsAllowed: e.target.checked })}
              className="w-4 h-4 text-[#01502E] rounded focus:ring-2 focus:ring-[#01502E]"
            />
            <span className="text-sm text-gray-700">Pets Allowed</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.available}
              onChange={e => setFormData({ ...formData, available: e.target.checked })}
              className="w-4 h-4 text-[#01502E] rounded focus:ring-2 focus:ring-[#01502E]"
            />
            <span className="text-sm text-gray-700">Available for Booking</span>
          </label>
        </div>
      </div>

      {/* Special Offer */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Special Offer (Optional)</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Discount Percent
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={formData.discountPercent || ""}
              onChange={e => setFormData({ ...formData, discountPercent: e.target.value ? parseFloat(e.target.value) : null })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Offer Label
            </label>
            <input
              type="text"
              value={formData.specialOffer}
              onChange={e => setFormData({ ...formData, specialOffer: e.target.value })}
              placeholder="e.g., Early Bird Discount"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-6 border-t">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm sm:text-base"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-[#01502E] text-white rounded-lg hover:bg-[#013d23] transition-colors disabled:opacity-50 text-sm sm:text-base"
        >
          {loading ? "Saving..." : room ? "Update Room" : "Add Room"}
        </button>
      </div>
    </form>
  );
}

