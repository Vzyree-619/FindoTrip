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
      <div className="absolute top-[16vh] left-[5vw] md:top-[30vh] md:left-[8vw] lg:top-[35vh] lg:left-[10vw] mx-auto z-10 flex justify-start font-bold text-2xl p-3 m-2">
        <h1 className="text-4xl text-white font-normal font-blauer sm:text-4xl md:text-5xl lg:text-6xl">
          The Best <br /> Experience Unlocked!
        </h1>
      </div>
      <div className="absolute inset-0 bg-gradient-to-b to-black from-transparent opacity-80" />
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
      <div className="absolute inset-0 mx-6 lg:mx-auto top-[35vh] md:top-[45vh] lg:top-[65%] lg:6xl sm:2xl">
        <form method="POST" action="/your-search-endpoint" className="w-full">
          <div className="flex w-full lg:w-fit mx-auto border border-orange-500 rounded-t-lg bg-white">
            {activeButton.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
                onClick={() => setIsActiveTab(item.id)}
                className={`h-[8vh] w-full md:h-[6vh] lg:px-14 sm:px-8 md:px-10 text-sm lg:font-medium lg:h-[7vh] lg:w-fit
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
          <div className="border border-orange-500 mx-auto max-w-5xl font-normal text-sm bg-white">
            {activeTabMapping[isActiveTab]}
          </div>
        </form>
      </div>
    </div>
  );
}

// Hotel Component
function Hotel({ formConfig, navigate }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const destination = formData.get('destination');
    const checkIn = formData.get('checkIn');
    const checkOut = formData.get('checkOut');
    const adults = formData.get('adults');
    const childs = formData.get('childs');
    
    const totalGuests = (parseInt(adults?.toString() || '0') + parseInt(childs?.toString() || '0'));
    const params = new URLSearchParams();
    if (destination) params.set('city', destination.toString());
    if (checkIn) params.set('checkIn', checkIn.toString());
    if (checkOut) params.set('checkOut', checkOut.toString());
    if (totalGuests > 0) params.set('guests', totalGuests.toString());
    
    navigate(`/accommodations/search?${params.toString()}`);
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
              className="px-3 py-2.5 h-14 outline-none border-r border-orange-500"
            />
          </div>
        ))}
        <button
          type="submit"
          onClick={handleSubmit}
          className="hidden md:block font-medium w-1/4 text-xl px-4 py-2 text-white bg-green-900 min-w-[120px]"
        >
          Search
        </button>
      </div>
      <div className="grid w-full grid-cols-1 border-x border-b border-orange-500 bg-white md:grid-cols-2 lg:grid-cols-3">
        {formConfig.hotel.fields.slice(1).map((field) => (
          <div
            key={field.name}
            className="flex py-1 px-0 lg:px-2 md:py-2 md:px-4 items-center border-r border-orange-500 border-b"
          >
            <div className="flex w-32 h-14 lg:h-auto md:w-full justify-start text-left">
              <DatePicker field={field} />
            </div>
          </div>
        ))}
        <Guests />
        <button
          type="submit"
          onClick={handleSubmit}
          className="md:hidden h-14 font-medium block w-full text-xl px-4 py-2 text-white bg-green-900 min-w-[120px]"
        >
          Search
        </button>
      </div>
    </>
  );
}

// CarRental Component
function CarRental({ formConfig, navigate }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const pickupLocation = formData.get('pickupLocation');
    const pickupDate = formData.get('pickupDate');
    const dropoffDate = formData.get('dropoffDate');
    
    const params = new URLSearchParams();
    if (pickupLocation) params.set('location', pickupLocation.toString());
    if (pickupDate) params.set('pickupDate', pickupDate.toString());
    if (dropoffDate) params.set('returnDate', dropoffDate.toString());
    
    navigate(`/vehicles?${params.toString()}`);
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
              className="px-3 py-2.5 h-14 outline-none border-r border-orange-500"
            />
          </div>
        ))}
        <button
          type="submit"
          onClick={handleSubmit}
          className="hidden md:block font-medium w-1/4 text-xl px-4 py-2 text-white bg-green-900 min-w-[120px]"
        >
          Search
        </button>
      </div>
      <div className="grid w-full grid-cols-1 border-x border-b border-orange-500 bg-white md:grid-cols-2 lg:grid-cols-3">
        {formConfig.carRental.fields.slice(1).map((field) => (
          <>
            <div
              key={field.name}
              className="flex py-1 px-0 md:px-2 md:py-2 lg:px-4 items-center border-r border-orange-500 border-b"
            >
              <div className="flex w-32 h-14 lg:h-auto md:w-full justify-start text-left">
                <DatePicker field={field} />
              </div>
            </div>
            {field.name === "pickupDate" && <Guests />}
          </>
        ))}

        <button
          type="submit"
          onClick={handleSubmit}
          className="md:hidden h-14 font-medium block w-full text-xl px-4 py-2 text-white bg-green-900 min-w-[120px]"
        >
          Search
        </button>
      </div>
    </>
  );
}

// Tours Component
function Tours({ formConfig, navigate }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const location = formData.get('location');
    const tourDate = formData.get('tourDate');
    
    const params = new URLSearchParams();
    if (location) params.set('destination', location.toString());
    if (tourDate) params.set('date', tourDate.toString());
    
    navigate(`/tours?${params.toString()}`);
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
              className="px-3 py-2.5 h-14 outline-none border-r border-orange-500"
            />
          </div>
        ))}
        <button
          type="submit"
          onClick={handleSubmit}
          className="hidden md:block font-medium w-1/4 text-xl px-4 py-2 text-white bg-green-900 min-w-[120px]"
        >
          Search
        </button>
      </div>
      <div className="grid w-full grid-cols-1 border-x border-b border-orange-500 bg-white md:grid-cols-2 lg:grid-cols-3">
        {formConfig.tours.fields.slice(1).map((field) => (
          <div
            key={field.name}
            className="flex py-1 px-0 md:px-2 md:py-2 lg:px-4 items-center border-r border-orange-500 border-b"
          >
            <div className="flex w-32 h-14 lg:h-auto md:w-full justify-start text-left">
              <DatePicker field={field} />
            </div>
          </div>
        ))}
        <TourDuration />
        <Guests />
        <button
          type="submit"
          onClick={handleSubmit}
          className="md:hidden h-14 font-medium block w-full text-xl px-4 py-2 text-white bg-green-900 min-w-[120px]"
        >
          Search
        </button>
      </div>
    </>
  );
}

// Activities Component
function Activities({ formConfig, navigate }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const activity = formData.get('activity');
    const activityDate = formData.get('activityDate');
    
    const params = new URLSearchParams();
    if (activity) params.set('location', activity.toString());
    if (activityDate) params.set('date', activityDate.toString());
    
    navigate(`/activities?${params.toString()}`);
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
              className="px-3 py-2.5 h-14 outline-none border-r border-orange-500"
            />
          </div>
        ))}
        <button
          type="submit"
          onClick={handleSubmit}
          className="hidden md:block font-medium w-1/4 text-xl px-4 py-2 text-white bg-green-900 min-w-[120px]"
        >
          Search
        </button>
      </div>
      <div className="grid w-full grid-cols-1 border-x border-b border-orange-500 bg-white md:grid-cols-2 lg:grid-cols-3">
        {formConfig.activities.fields.slice(1).map((field) => (
          <div
            key={field.name}
            className="flex py-1 px-0 md:px-2 md:py-2 lg:px-4 items-center border-r border-orange-500 border-b"
          >
            <div className="flex w-32 h-14 lg:h-auto md:w-full justify-start text-left">
              <DatePicker field={field} />
            </div>
          </div>
        ))}
        <ActivityTypes />
        <GroupSize />
        <button
          type="submit"
          onClick={handleSubmit}
          className="md:hidden h-14 font-medium block w-full text-xl px-4 py-2 text-white bg-green-900 min-w-[120px]"
        >
          Search
        </button>
      </div>
    </>
  );
}
