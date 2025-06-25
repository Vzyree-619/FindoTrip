export default function HotelPage() {
  // Define the data locally
  const availability = {
    checkIn: "Any Time You Want",
    checkOut: "10:00 AM to 12:00 PM",
    cancellationPolicy: "Cancellation and prepayment policies vary according to accommodation type.",
    childPolicy: "Children of all ages are welcome.",
    cribAndExtraBed: "Cribs and extra beds are available at this property.",
    pets: "Pets are not allowed but we can adjust if u want .",
    parties: "Parties/events can be allowed according to the condition."
  };

  const faqs = [
    { question: "What time is check-in?", answer: "Check-in is from 2:00 PM to 11:00 PM." },
    { question: "What time is check-out?", answer: "Check-out is from 10:00 AM to 12:00 PM." }
  ];

  return (
    <div className="p-4">
      {/* Availability Section */}
      <div className="p-6 mt-8 border rounded-lg shadow-sm">
        <h2 className="mb-4 text-2xl font-bold">Availability</h2>
        <p><strong>Check-in:</strong> {availability.checkIn}</p>
        <p><strong>Check-out:</strong> {availability.checkOut}</p>
        <p><strong>Cancellation Policy:</strong> {availability.cancellationPolicy}</p>
        <p><strong>Child Policy:</strong> {availability.childPolicy}</p>
        <p><strong>Cribs & Extra Beds:</strong> {availability.cribAndExtraBed}</p>
        <p><strong>Pets:</strong> {availability.pets}</p>
        <p><strong>Parties:</strong> {availability.parties}</p>
      </div>

      {/* FAQ Section */}
      <div className="p-6 mt-8 border rounded-lg shadow-sm">
        <h2 className="mb-4 text-2xl font-bold">Frequently Asked Questions</h2>
        {faqs.map((faq, index) => (
          <div key={index} className="mb-4">
            <p className="font-semibold">{faq.question}</p>
            <p>{faq.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
