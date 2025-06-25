import { useState } from "react";
import { FaComments, FaChevronDown, FaChevronRight } from "react-icons/fa";

export default function TravelersAsking({ travelersAsking = [] }) {
  const [openIndex, setOpenIndex] = useState(null);

 
  const dummyData = [
    { question: "What amenities should I look for in a hotel?", answer: "Essential amenities include free Wi-Fi, breakfast, parking, and a 24-hour front desk." },
    { question: "How can I find the best hotel deals?", answer: "Use comparison websites, book in advance, and check for promo codes or loyalty programs." },
    { question: "What are some budget-friendly travel destinations?", answer: "Affordable travel spots include Thailand, Vietnam, Mexico, and Portugal." },
    { question: "Is it better to stay in a hotel or an Airbnb?", answer: "Hotels offer services like housekeeping, while Airbnbs provide more space and local experiences." },
    { question: "How can I avoid tourist traps while traveling?", answer: "Research online, read reviews, and ask locals for recommendations to find authentic experiences." },
    { question: "What should I pack for a hotel stay?", answer: "Pack essentials like toiletries, chargers, comfortable clothes, and travel documents." },
    { question: "How do I check hotel reviews before booking?", answer: "Use platforms like TripAdvisor, Google Reviews, and Booking.com to read guest experiences." },
    { question: "What are some must-have travel apps?", answer: "Essential apps include Google Maps, Airbnb, Skyscanner, and a language translation app." },
  ];

  const questionsList = travelersAsking.length > 0 ? travelersAsking : dummyData;

  const toggleAnswer = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4">Travelers are asking</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {questionsList.map((item, index) => (
          <div key={index} className="bg-gray-100 p-4 rounded-lg shadow-md">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleAnswer(index)}
            >
              <div className="flex items-center space-x-2">
                <span className="text-gray-500">
                  <FaComments />
                </span>
                <p className="text-gray-700">{item.question}</p>
              </div>
              <span className="text-gray-500">
                {openIndex === index ? <FaChevronDown /> : <FaChevronRight />}
              </span>
            </div>
            {openIndex === index && (
              <p className="mt-2 text-gray-600">{item.answer}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
