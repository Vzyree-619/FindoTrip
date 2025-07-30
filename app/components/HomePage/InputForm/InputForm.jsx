/* eslint-disable react/prop-types */
import { useActionData } from "@remix-run/react";
import { useState } from "react";
import DatePicker from "./ShadcnComp/DatePicker";
import TourDuration, {
  ActivityTypes,
  GroupSize,
  Guests,
} from "./ShadcnComp/TourDuration";

export default function InputForm() {
  const validationErrors = useActionData();
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
    1: <Hotel formConfig={formConfig} />,
    2: <CarRental formConfig={formConfig} />,
    3: <Tours formConfig={formConfig} />,
    4: <Activities formConfig={formConfig} />,
  };

  const activeButton = [
    { id: 1, label: "Hotel" },
    { id: 2, label: "Car Rental" },
    { id: 3, label: "Tours" },
    { id: 4, label: "Activities" },
  ];

  return (
    <div className="relative h-[70%]">
        <div className="absolute  top-[35vh] left-[10vw] mx-auto z-10 flex justify-start font-bold text-2xl p-3 m-2">
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
      <div className="absolute inset-0 top-[65%] mx-auto max-w-6xl">
        <div className="flex w-fit mx-auto border border-orange-500 rounded-t-lg bg-white">
          {activeButton.map((item, index) => (
            <button
              key={item.id}
              onClick={() => setIsActiveTab(item.id)}
              className={`py-2 px-4 lg:px-14 sm:px-8 md:px-10 text-sm font-medium h-[4vmax] lg:h-[3.5vmax]
                ${index !== activeButton.length - 1 ? "border-r border-orange-500" : "rounded-tr"}
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
      </div>
    </div>
  );
}

// Hotel Component
function Hotel({ formConfig }) {
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
          className="font-medium block w-1/4 text-xl px-4 py-2 text-white bg-green-900 min-w-[120px]"
        >
          Search
        </button>
      </div>
      <div className="grid grid-flow-col w-full bg-white">
        {formConfig.hotel.fields.slice(1).map((field) => (
          <div
            key={field.name}
            className="flex py-2 px-4 items-center border-r border-orange-500"
          >
            <div className="flex w-full justify-start text-left">
              <DatePicker field={field} />
            </div>
          </div>
        ))}
        <Guests />
      </div>
    </>
  );
}

// CarRental Component
function CarRental({ formConfig }) {
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
          className="font-medium block w-1/4 text-xl px-4 py-2 text-white bg-green-900 min-w-[120px]"
        >
          Search
        </button>
      </div>
      <div className="grid grid-flow-col w-full bg-white">
        {formConfig.carRental.fields.slice(1).map((field) => (
          <div
            key={field.name}
            className="flex py-2 px-4 items-center border-r border-orange-500"
          >
            <div className="flex w-full justify-start text-left">
              <DatePicker field={field} />
            </div>
          </div>
        ))}
        <Guests />
      </div>
    </>
  );
}

// Tours Component
function Tours({ formConfig }) {
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
          className="font-medium block w-1/4 text-xl px-4 py-2 text-white bg-green-900 min-w-[120px]"
        >
          Search
        </button>
      </div>
      <div className="grid grid-flow-col w-full bg-white">
        {formConfig.tours.fields.slice(1).map((field) => (
          <div
            key={field.name}
            className="flex py-2 px-4 items-center border-r border-orange-500"
          >
            <div className="flex w-full justify-start text-left">
              <DatePicker field={field} />
            </div>
          </div>
        ))}
        <TourDuration />
        <Guests />
      </div>
    </>
  );
}

// Activities Component
function Activities({ formConfig }) {
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
          className="font-medium block w-1/4 text-xl px-4 py-2 text-white bg-green-900 min-w-[120px]"
        >
          Search
        </button>
      </div>
      <div className="grid grid-flow-col w-full bg-white">
        {formConfig.activities.fields.slice(1).map((field) => (
          <div
            key={field.name}
            className="flex py-2 px-4 items-center border-r border-orange-500"
          >
            <div className="flex w-full justify-start text-left">
              <DatePicker field={field} />
            </div>
          </div>
        ))}
        <ActivityTypes />
        <GroupSize />
      </div>
    </>
  );
}
