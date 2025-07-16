// // app/routes/index.jsx or any other route file
import { useActionData } from "@remix-run/react";
import { useState } from "react";
import FormSection from "./SubSets/FormSection";
import TabHandle from "./SubSets/TabHandle";
//ExpenceForm
export default function InputForm() {
  const validationErrors = useActionData();
  const [activeTab, setActiveTab] = useState("hotel");
  // const navigation = useNavigate();
  // const isSubmitting = navigation.state !=='idle'
  // <button disabled={isSubmitting} type="submit" className="w-full p-2 text-white bg-blue-500 rounded">{isSubmitting ? 'saving... ': 'Save'}</button>
  // FormConfig
  const formConfig = {
    hotel: {
      fields: [
        { name: "destination", placeholder: "Enter destination", type: "text" },
        { name: "checkIn", label: "CheckIn", type: "date" },
        { name: "checkOut", label: "CheckOut", type: "date" },
        { name: "adults", placeholder: "Adults", type: "number" },
        { name: "childs", placeholder: "Childs", type: "number" },
        { name: "rooms", placeholder: "Room", type: "number" },
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
        { name: "tourDate", label: "Tour Date", type: "date" },
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

  return (
    <div className=" relative bg-gradient-to-r bg-black">
      <img
        className="w-[100vw] rounded h-[90vh] object-cover object-[50%_35%] "
        src="landingPageImg.jpg"
        alt="homeImg"
      />
      {validationErrors?.errors && (
        <div className="mb-4 text-red-500 border border-red-500 rounded p-2">
          <ul>
            {Object.values(validationErrors.errors).map((error, idx) => (
              <li key={idx}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="absolute top-[30vh] left-[10vw]">
        <h1 className="text-4xl/[50px] text-white  text-start sm:text-4xl md:text-5xl lg:6xl">
          The Best <br /> Experience Unlocked!
        </h1>
        <div className="p-4 bg-white rounded-lg ">
          <TabHandle activeTab={activeTab} setActiveTab={setActiveTab} />
          <FormSection tab={activeTab} config={formConfig[activeTab]} />
        </div>
      </div>
    </div>
  );
}
