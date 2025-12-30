/* eslint-disable react/prop-types */
import { useActionData, useNavigate } from "@remix-run/react";
import { useState } from "react";
import DatePicker from "./ShadcnComp/DatePicker";
import TourDuration, {
  ActivityTypes,
  GroupSize,
  Guests,
} from "./ShadcnComp/TourDuration";

export default function InputForm() {
  const validationErrors = useActionData();
  const navigate = useNavigate();
  const [isActiveTab, setIsActiveTab] = useState(1);

  const formConfig = {
    hotel: {
      fields: [
        { name: "destination", placeholder: "Enter destination", type: "text" },
        { name: "checkIn", label: "Check In - Date", type: "date" },
        { name: "checkOut", label: "Check Out - Date", type: "date" },
      ],
      hidden: { formType: "hotelData" },
    },
    carRental: {
      fields: [
        {
          name: "pickupLocation",
          placeholder: "Enter pick-up location",
          type: "text",
        },
        { name: "pickupDate", label: "Pick-up Date", type: "date" },
        { name: "dropoffDate", label: "Drop-off Date", type: "date" },
      ],
      hidden: { formType: "carRental" },
    },
    tours: {
      fields: [
        { name: "location", placeholder: "Enter location", type: "text" },
        { name: "tourDate", label: "Tour Start Date", type: "date" },
      ],
      hidden: { formType: "tour" },
    },
    activities: {
      fields: [
        {
          name: "activity",
          placeholder: "Search for activities",
          type: "text",
        },
        { name: "activityDate", label: "Activity Date", type: "date" },
      ],
      hidden: { formType: "activity" },
    },
  };

  const activeTabMapping = {
    1: <Hotel formConfig={formConfig} navigate={navigate} />,
    2: <CarRental formConfig={formConfig} navigate={navigate} />,
    3: <Tours formConfig={formConfig} navigate={navigate} />,
    4: <Activities formConfig={formConfig} navigate={navigate} />,
  };

  const activeButton = [
    { id: 1, label: "Hotel" },
    { id: 2, label: "Car Rental" },
    { id: 3, label: "Tours" },
    { id: 4, label: "Activities" },
  ];

  return (
    <div className="relative h-[70%]">
      <div className="absolute top-[16vh] left-[5vw] md:top-[30vh] md:left-[8vw] lg:top-[35vh] lg:left-[10vw] mx-auto z-10 flex justify-start font-bold text-2xl p-3 m-2 pointer-events-none">
        <h1 className="text-4xl text-white font-normal font-blauer sm:text-4xl md:text-5xl lg:text-6xl">
          The Best <br /> Experience Unlocked!
        </h1>
      </div>
      <div className="absolute inset-0 bg-gradient-to-b to-black from-transparent opacity-80 pointer-events-none" />
      <img
        className="w-full h-[90vh] object-cover object-[50%_35%]"
        src="landingPageImg.jpg"
        alt="homeImg"
      />

      {validationErrors?.errors && (
        <div className="mb-4 text-red-500 border border-red-500 rounded p-2 z-10">
          <ul>
            {Object.values(validationErrors.errors).map((error, idx) => (
              <li key={idx}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="absolute inset-0 mx-4 sm:mx-6 lg:mx-auto top-[35vh] md:top-[45vh] lg:top-[65%] max-w-full z-30">
        <div className="w-full max-w-6xl mx-auto">
          <div className="flex w-full mx-auto border border-orange-500 rounded-t-lg bg-white">
            {activeButton.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
                onClick={() => setIsActiveTab(item.id)}
                className={`h-12 sm:h-14 md:h-12 lg:h-14 px-2 sm:px-4 md:px-6 lg:px-14 text-xs sm:text-sm lg:text-sm font-medium flex-1 min-w-0 whitespace-nowrap
                ${
                  index !== activeButton.length - 1
                    ? "border-r border-orange-500"
                    : "rounded-tr"
                }
                ${index === 0 ? "rounded-tl" : ""}
                ${
                  item.id === isActiveTab
                    ? "bg-green-900 text-white"
                    : "bg-white text-black"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="border border-orange-500 mx-auto max-w-6xl font-normal text-sm bg-white">
            {activeTabMapping[isActiveTab]}
          </div>
        </div>
      </div>
    </div>
  );
}

// Hotel Component
function Hotel({ formConfig, navigate }) {
  const [errors, setErrors] = useState({ destination: '', checkIn: '', checkOut: '' });
  // Handle form submission with direct values
  const handleSubmit = (formData) => {
    const destination = formData.destination;
    const checkIn = formData.checkIn;
    const checkOut = formData.checkOut;
    const adults = document.querySelector('input[name="adults"]')?.value;
    const childs = document.querySelector('input[name="childs"]')?.value;

    const totalGuests = (parseInt(adults?.toString() || '0') + parseInt(childs?.toString() || '0'));
    const params = new URLSearchParams();
    if (destination) params.set('city', destination.toString());
    if (checkIn) params.set('checkIn', checkIn.toString());
    if (checkOut) params.set('checkOut', checkOut.toString());
    // Add nights if both dates present
    if (checkIn && checkOut) {
      try {
        const ci = new Date(checkIn.toString());
        const co = new Date(checkOut.toString());
        const nights = Math.max(0, Math.round((co.getTime() - ci.getTime()) / (1000 * 60 * 60 * 24)));
        params.set('nights', nights.toString());
      } catch (error) {
        console.warn('Error calculating nights:', error);
      }
    }
    if (totalGuests > 0) params.set('guests', totalGuests.toString());

    setErrors({ destination: '', checkIn: '', checkOut: '' });
    try {
      navigate(`/accommodations?${params.toString()}`);
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback to basic navigation
      window.location.href = `/accommodations?${params.toString()}`;
    }
  };

  return (
    <>
      <div className="flex border-b border-orange-500">
        {formConfig.hotel.fields.slice(0, 1).map((field) => (
          <div key={field.name} className="flex flex-col w-full">
            <input
              type={field.type}
              name={field.name}
              placeholder={field.placeholder}
              className="px-3 py-2.5 h-14 outline-none border-r border-orange-500 w-full"
            />
            {errors.destination && (
              <div className="text-red-600 text-xs px-3 py-1">{errors.destination}</div>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // Get form data directly from the DOM
            const checkIn = document.querySelector('input[name="checkIn"]')?.value;
            const checkOut = document.querySelector('input[name="checkOut"]')?.value;
            const destination = document.querySelector('input[name="destination"]')?.value;
            const newErrors = { destination: '', checkIn: '', checkOut: '' };
            if (!destination) newErrors.destination = 'Please enter a destination.';
            if (!checkIn) newErrors.checkIn = 'Please select a check-in date.';
            if (!checkOut) newErrors.checkOut = 'Please select a check-out date.';
            if (newErrors.destination || newErrors.checkIn || newErrors.checkOut) {
              setErrors(newErrors);
              return;
            }
            // Pass data directly to handleSubmit
            handleSubmit({ destination, checkIn, checkOut });
          }}
          className="hidden md:block font-medium flex-1 max-w-[150px] text-lg lg:text-xl px-3 lg:px-4 py-2 text-white bg-green-900"
        >
          Search
        </button>
      </div>
      <div className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 border-x border-b border-orange-500 bg-white">
        {formConfig.hotel.fields.slice(1).map((field) => (
          <div
            key={field.name}
            className="flex py-1 px-0 lg:px-2 md:py-2 md:px-4 items-center border-r border-orange-500 border-b"
          >
            <div className="flex w-full min-w-0 h-14 lg:h-auto justify-start text-left">
              <DatePicker field={field} />
            </div>
            {field.name === 'checkIn' && errors.checkIn && (
              <div className="text-red-600 text-xs px-3 py-1">{errors.checkIn}</div>
            )}
            {field.name === 'checkOut' && errors.checkOut && (
              <div className="text-red-600 text-xs px-3 py-1">{errors.checkOut}</div>
            )}
          </div>
        ))}
        <Guests />
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // Get form data directly from the DOM
            const checkIn = document.querySelector('input[name="checkIn"]')?.value;
            const checkOut = document.querySelector('input[name="checkOut"]')?.value;
            const destination = document.querySelector('input[name="destination"]')?.value;
            const newErrors = { destination: '', checkIn: '', checkOut: '' };
            if (!destination) newErrors.destination = 'Please enter a destination.';
            if (!checkIn) newErrors.checkIn = 'Please select a check-in date.';
            if (!checkOut) newErrors.checkOut = 'Please select a check-out date.';
            if (newErrors.destination || newErrors.checkIn || newErrors.checkOut) {
              setErrors(newErrors);
              if (newErrors.checkIn || newErrors.checkOut) {
                alert('Please select both check-in and check-out dates.');
              }
              return;
            }
            // Pass data directly to handleSubmit
            handleSubmit({ destination, checkIn, checkOut });
          }}
          className="md:hidden h-14 font-medium block w-full text-lg sm:text-xl px-4 py-2 text-white bg-green-900"
        >
          Search
        </button>
      </div>
    </>
  );
}

// CarRental Component
function CarRental({ formConfig, navigate }) {
  const [errors, setErrors] = useState({ pickupLocation: '', pickupDate: '', dropoffDate: '' });
  const handleSubmit = (formData) => {
    const pickupLocation = formData.pickupLocation;
    const pickupDate = formData.pickupDate;
    const dropoffDate = formData.dropoffDate;

    const params = new URLSearchParams();
    if (pickupLocation) params.set('location', pickupLocation.toString());
    if (pickupDate) params.set('pickupDate', pickupDate.toString());
    if (dropoffDate) params.set('returnDate', dropoffDate.toString());
    // Days for rentals
    if (pickupDate && dropoffDate) {
      try {
        const pu = new Date(pickupDate.toString());
        const ro = new Date(dropoffDate.toString());
        const days = Math.max(1, Math.round((ro.getTime() - pu.getTime()) / (1000 * 60 * 60 * 24)));
        params.set('days', days.toString());
      } catch (error) {
        console.warn('Error calculating rental days:', error);
      }
    }

    setErrors({ pickupLocation: '', pickupDate: '', dropoffDate: '' });
    try {
      navigate(`/vehicles?${params.toString()}`);
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback to basic navigation
      window.location.href = `/vehicles?${params.toString()}`;
    }
  };

  return (
    <>
      <div className="flex border-b-2 border-orange-500">
        {formConfig.carRental.fields.slice(0, 1).map((field) => (
          <div key={field.name} className="flex flex-col w-full">
            <input
              type={field.type}
              name={field.name}
              placeholder={field.placeholder}
              className="px-3 py-2.5 h-14 outline-none border-r border-orange-500 w-full"
            />
            {errors.pickupLocation && (
              <div className="text-red-600 text-xs px-3 py-1">{errors.pickupLocation}</div>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // Get form data directly from the DOM
            const pickupDate = document.querySelector('input[name="pickupDate"]')?.value;
            const dropoffDate = document.querySelector('input[name="dropoffDate"]')?.value;
            const pickupLocation = document.querySelector('input[name="pickupLocation"]')?.value;
            const newErrors = { pickupLocation: '', pickupDate: '', dropoffDate: '' };
            if (!pickupLocation) newErrors.pickupLocation = 'Please enter a pick-up location.';
            if (!pickupDate) newErrors.pickupDate = 'Please select a pick-up date.';
            if (!dropoffDate) newErrors.dropoffDate = 'Please select a drop-off date.';
            if (newErrors.pickupLocation || newErrors.pickupDate || newErrors.dropoffDate) {
              setErrors(newErrors);
              return;
            }
            // Pass data directly to handleSubmit
            handleSubmit({ pickupLocation, pickupDate, dropoffDate });
          }}
          className="hidden md:block font-medium flex-1 max-w-[150px] text-lg lg:text-xl px-3 lg:px-4 py-2 text-white bg-green-900"
        >
          Search
        </button>
      </div>
      <div className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 border-x border-b border-orange-500 bg-white">
        {formConfig.carRental.fields.slice(1).map((field) => (
          <>
            <div
              key={field.name}
              className="flex py-1 px-0 md:px-2 md:py-2 lg:px-4 items-center border-r border-orange-500 border-b"
            >
              <div className="flex w-full min-w-0 h-14 lg:h-auto justify-start text-left">
                <DatePicker field={field} />
              </div>
            </div>
            {field.name === "pickupDate" && <Guests />}
          </>
        ))}

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // Get form data directly from the DOM
            const pickupDate = document.querySelector('input[name="pickupDate"]')?.value;
            const dropoffDate = document.querySelector('input[name="dropoffDate"]')?.value;
            const pickupLocation = document.querySelector('input[name="pickupLocation"]')?.value;
            const newErrors = { pickupLocation: '', pickupDate: '', dropoffDate: '' };
            if (!pickupLocation) newErrors.pickupLocation = 'Please enter a pick-up location.';
            if (!pickupDate) newErrors.pickupDate = 'Please select a pick-up date.';
            if (!dropoffDate) newErrors.dropoffDate = 'Please select a drop-off date.';
            if (newErrors.pickupLocation || newErrors.pickupDate || newErrors.dropoffDate) {
              setErrors(newErrors);
              if (newErrors.pickupDate || newErrors.dropoffDate) {
                alert('Please select both pick-up and drop-off dates.');
              }
              return;
            }
            // Pass data directly to handleSubmit
            handleSubmit({ pickupLocation, pickupDate, dropoffDate });
          }}
          className="md:hidden h-14 font-medium block w-full text-lg sm:text-xl px-4 py-2 text-white bg-green-900"
        >
          Search
        </button>
      </div>
    </>
  );
}

// Tours Component
function Tours({ formConfig, navigate }) {
  const [errors, setErrors] = useState({ location: '', tourDate: '' });
  const handleSubmit = (formData) => {
    const location = formData.location;
    const tourDate = formData.tourDate;
    const days = document.querySelector('input[name="days"]')?.value;
    const activityType = document.querySelector('input[name="activityType"]')?.value;
    const groupSize = document.querySelector('input[name="groupSize"]')?.value;

    const params = new URLSearchParams();
    if (location) params.set('search', location.toString());
    if (tourDate) params.set('date', tourDate.toString());
    if (days) params.set('days', days.toString());
    if (activityType) params.set('activityType', activityType.toString());
    if (groupSize) params.set('groupSize', groupSize.toString());

    setErrors({ location: '', tourDate: '' });
    try {
      navigate(`/tours?${params.toString()}`);
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback to basic navigation
      window.location.href = `/tours?${params.toString()}`;
    }
  };

  return (
    <>
      <div className="flex border-b-2 border-orange-500">
        {formConfig.tours.fields.slice(0, 1).map((field) => (
          <div key={field.name} className="flex flex-col w-full">
            <input
              type={field.type}
              name={field.name}
              placeholder={field.placeholder}
              className="px-3 py-2.5 h-14 outline-none border-r border-orange-500 w-full"
            />
            {errors.location && (
              <div className="text-red-600 text-xs px-3 py-1">{errors.location}</div>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // Get form data directly from the DOM
            const tourDate = document.querySelector('input[name="tourDate"]')?.value;
            const location = document.querySelector('input[name="location"]')?.value;
            const newErrors = { location: '', tourDate: '' };
            if (!location) newErrors.location = 'Please enter a location.';
            if (!tourDate) newErrors.tourDate = 'Please select a tour start date.';
            if (newErrors.location || newErrors.tourDate) {
              setErrors(newErrors);
              return;
            }
            // Pass data directly to handleSubmit
            handleSubmit({ location, tourDate });
          }}
          className="hidden md:block font-medium flex-1 max-w-[150px] text-lg lg:text-xl px-3 lg:px-4 py-2 text-white bg-green-900"
        >
          Search
        </button>
      </div>
      <div className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 border-x border-b border-orange-500 bg-white">
        {formConfig.tours.fields.slice(1).map((field) => (
          <div
            key={field.name}
            className="flex py-1 px-0 md:px-2 md:py-2 lg:px-4 items-center border-r border-orange-500 border-b"
          >
            <div className="flex w-full min-w-0 h-14 lg:h-auto justify-start text-left">
              <DatePicker field={field} />
            </div>
            {field.name === 'pickupDate' && errors.pickupDate && (
              <div className="text-red-600 text-xs px-3 py-1">{errors.pickupDate}</div>
            )}
            {field.name === 'dropoffDate' && errors.dropoffDate && (
              <div className="text-red-600 text-xs px-3 py-1">{errors.dropoffDate}</div>
            )}
          </div>
        ))}
        <TourDuration />
        <Guests />
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // Get form data directly from the DOM
            const tourDate = document.querySelector('input[name="tourDate"]')?.value;
            const location = document.querySelector('input[name="location"]')?.value;
            const newErrors = { location: '', tourDate: '' };
            if (!location) newErrors.location = 'Please enter a location.';
            if (!tourDate) newErrors.tourDate = 'Please select a tour start date.';
            if (newErrors.location || newErrors.tourDate) {
              setErrors(newErrors);
              if (newErrors.tourDate) {
                alert('Please select a tour start date.');
              }
              return;
            }
            // Pass data directly to handleSubmit
            handleSubmit({ location, tourDate });
          }}
          className="md:hidden h-14 font-medium block w-full text-lg sm:text-xl px-4 py-2 text-white bg-green-900"
        >
          Search
        </button>
      </div>
    </>
  );
}

// Activities Component
function Activities({ formConfig, navigate }) {
  const [errors, setErrors] = useState({ activity: '', activityDate: '' });
  const handleSubmit = (formData) => {
    const activity = formData.activity;
    const activityDate = formData.activityDate;

    const params = new URLSearchParams();
    if (activity) params.set('search', activity.toString());
    if (activityDate) params.set('date', activityDate.toString());

    setErrors({ activity: '', activityDate: '' });
    try {
      navigate(`/tours?${params.toString()}`);
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback to basic navigation
      window.location.href = `/tours?${params.toString()}`;
    }
  };

  return (
    <>
      <div className="flex border-b-2 border-orange-500">
        {formConfig.activities.fields.slice(0, 1).map((field) => (
          <div key={field.name} className="flex flex-col w-full">
            <input
              type={field.type}
              name={field.name}
              placeholder={field.placeholder}
              className="px-3 py-2.5 h-14 outline-none border-r border-orange-500 w-full"
            />
            {errors.activity && (
              <div className="text-red-600 text-xs px-3 py-1">{errors.activity}</div>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // Get form data directly from the DOM
            const activityDate = document.querySelector('input[name="activityDate"]')?.value;
            const activity = document.querySelector('input[name="activity"]')?.value;
            const newErrors = { activity: '', activityDate: '' };
            if (!activity) newErrors.activity = 'Please enter an activity.';
            if (!activityDate) newErrors.activityDate = 'Please select an activity date.';
            if (newErrors.activity || newErrors.activityDate) {
              setErrors(newErrors);
              return;
            }
            // Pass data directly to handleSubmit
            handleSubmit({ activity, activityDate });
          }}
          className="hidden md:block font-medium flex-1 max-w-[150px] text-lg lg:text-xl px-3 lg:px-4 py-2 text-white bg-green-900"
        >
          Search
        </button>
      </div>
      <div className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 border-x border-b border-orange-500 bg-white">
        {formConfig.activities.fields.slice(1).map((field) => (
          <div
            key={field.name}
            className="flex py-1 px-0 md:px-2 md:py-2 lg:px-4 items-center border-r border-orange-500 border-b"
          >
            <div className="flex w-full min-w-0 h-14 lg:h-auto justify-start text-left">
              <DatePicker field={field} />
            </div>
            {field.name === 'activityDate' && errors.activityDate && (
              <div className="text-red-600 text-xs px-3 py-1">{errors.activityDate}</div>
            )}
          </div>
        ))}
        <ActivityTypes />
        <GroupSize />
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // Get form data directly from the DOM
            const activityDate = document.querySelector('input[name="activityDate"]')?.value;
            const activity = document.querySelector('input[name="activity"]')?.value;
            const newErrors = { activity: '', activityDate: '' };
            if (!activity) newErrors.activity = 'Please enter an activity.';
            if (!activityDate) newErrors.activityDate = 'Please select an activity date.';
            if (newErrors.activity || newErrors.activityDate) {
              setErrors(newErrors);
              if (newErrors.activityDate) {
                alert('Please select an activity date.');
              }
              return;
            }
            // Pass data directly to handleSubmit
            handleSubmit({ activity, activityDate });
          }}
          className="md:hidden h-14 font-medium block w-full text-lg sm:text-xl px-4 py-2 text-white bg-green-900"
        >
          Search
        </button>
      </div>
    </>
  );
}
