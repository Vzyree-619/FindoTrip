import { useState, useRef, useLayoutEffect } from "react";
import { gsap } from "gsap";
import { ChevronDown } from "lucide-react";

const faqData = [
  {
    question: "Can I get refund on my cancelled bookings?",
    answer: "Yes, you can get a refund as per our cancellation policy. Refunds are processed within 5–7 business days.",
  },
  {
    question: "How to reschedule my trip?",
    answer: "Contact our support team at least 3 days before departure to reschedule your tour.",
  },
  {
    question: "Are meals included in the package?",
    answer: "Most packages include breakfast and dinner. Please check the package details for specifics.",
  },
  {
    question: "What if the weather is bad during my trip?",
    answer: "We'll adjust the itinerary to ensure your safety and enjoyment, or offer alternatives where possible.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);
  const answerRefs = useRef([]);

  useLayoutEffect(() => {
    faqData.forEach((_, index) => {
      if (answerRefs.current[index]) {
        gsap.set(answerRefs.current[index], { height: 0, overflow: "hidden" });
      }
    });
  }, []);

  const toggleAnswer = (index) => {
    const content = answerRefs.current[index];
    if (!content) return;

    const isOpen = openIndex === index;

    if (isOpen) {
      gsap.to(content, {
        height: 0,
        duration: 0.4,
        ease: "power2.inOut",
        onComplete: () => setOpenIndex(null),
      });
    } else {
      if (openIndex !== null && answerRefs.current[openIndex]) {
        gsap.to(answerRefs.current[openIndex], {
          height: 0,
          duration: 0.4,
          ease: "power2.inOut",
        });
      }

      gsap.to(content, {
        height: "auto",
        duration: 0.4,
        ease: "power2.inOut",
      });

      setOpenIndex(index);
    }
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-start gap-6 w-[97vw] max-w-7xl mx-auto p-4 md:p-8 overflow-y-hidden bg-[#01502E] rounded">
      {/* FAQs Section */}
      <div className="flex flex-col gap-4 w-full md:w-2/3">
        {faqData.map((item, index) => (
          <div key={index} className="border border-green-700 rounded-md">
            <button
              onClick={() => toggleAnswer(index)}
              className="flex justify-between items-center w-full px-4 py-2 text-left text-white font-medium"
            >
              {item.question}
              <ChevronDown className={`transition-transform duration-300 ${openIndex === index ? "rotate-180" : ""}`} />
            </button>
            <div
              ref={(el) => (answerRefs.current[index] = el)}
              className="px-4 text-sm text-white"
            >
              <p className="py-2">{item.answer}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Heading */}
      <div className="text-center md:text-right md:w-1/3">
        <h2 className="text-2xl md:text-3xl font-bold text-orange-600 leading-tight">
          FREQUENTLY <br /> ASKED <br /> QUESTIONS!
        </h2>
      </div>
    </div>
  );
}