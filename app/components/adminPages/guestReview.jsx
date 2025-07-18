export default function GuestReviews() {
    const reviews = [
      { category: "Staff", score: 6.5, color: "bg-green-500" },
      { category: "Facilities", score: 7.0, color: "bg-blue-500" },
      { category: "Cleanliness", score: 6.5, color: "bg-green-500" },
      { category: "Comfort", score: 7.5, color: "bg-blue-600" },
      { category: "Value for money", score: 5.5, color: "bg-green-500" },
      { category: "Location", score: 8.0, color: "bg-blue-600" },
      { category: "Staff", score: 6.5, color: "bg-green-500" },
      { category: "Facilities", score: 7.0, color: "bg-blue-500" },
      { category: "Cleanliness", score: 8.5, color: "bg-blue-500" },
    ];
  
    return (
      <div className="max-w-4xl mx-auto p-4 bg-white shadow-md rounded-md">
        {/* Header */}
        <div className="flex items-center space-x-2">
          <span className="bg-blue-600 text-white px-2 py-1 rounded-md text-lg font-semibold">
            6.2
          </span>
          <p className="text-lg font-semibold">Pleasant · 5 reviews</p>
          <a href="#" className="text-blue-600 hover:underline text-sm">
            Read all reviews
          </a>
        </div>
  
        {/* Categories */}
        <h3 className="mt-4 text-lg font-semibold">Categories:</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          {reviews.map((review, index) => (
            <div key={index} className="flex flex-col space-y-1">
              <div className="flex justify-between text-sm font-medium">
                <span>{review.category}</span>
                <span>{review.score}</span>
              </div>
              <div className="relative w-full h-2 bg-gray-200 rounded-full">
                <div
                  className={`absolute top-0 left-0 h-full rounded-full ${review.color}`}
                  style={{ width: `${(review.score / 10) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
  
       
      </div>
    );
  }
  