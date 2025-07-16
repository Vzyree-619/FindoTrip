import PropTypes from "prop-types";
const tabs = [
  { id: "hotel", label: "Hotel" },
  { id: "carRental", label: "Car Rental" },
  { id: "tours", label: "Tours" },
  { id: "activities", label: "Activities" },
];


function TabHandle({ activeTab, setActiveTab }) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`px-4 py-2 rounded border hover:cursor-pointer ${
            activeTab === tab.id ? "bg-[#01502E] text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

TabHandle.propTypes = {
  activeTab: PropTypes.string.isRequired,
  setActiveTab: PropTypes.func.isRequired,
};
export default TabHandle;
