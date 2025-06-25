// // app/routes/index.jsx or any other route file
import {  useActionData} from '@remix-run/react';
import { useState } from 'react';


//ExpenceForm
export default function InputForm() {
 const validationErrors = useActionData();
  const [activeTab, setActiveTab] = useState('hotel');
  // const navigation = useNavigate();
  // const isSubmitting = navigation.state !=='idle'
  // <button disabled={isSubmitting} type="submit" className="w-full p-2 text-white bg-blue-500 rounded">{isSubmitting ? 'saving... ': 'Save'}</button>
  return (
    <div className="p-4 relative">
      <img className='w-[100vw] rounded h-[75vh] object-cover object-[50%_35%] z-[-99]' src="landingPageImg.jpg" alt="homeImg" />
   {validationErrors?.errors && (
  <div className="mb-4 text-red-500 border border-red-500 rounded p-2">
    <ul>
      {Object.values(validationErrors.errors).map((error, idx) => (
        <li key={idx}>{error}</li>
      ))}
    </ul>
  </div>
)}

<div className="flex flex-wrap gap-4 mb-4 items-center justify-center bg-[#FFFFFF] rounded lg:absolute top-[65vh] left-[35vw] w-full lg:w-auto p-2">
  <button
    className={`px-4 py-2 rounded ${activeTab === 'hotel' ? 'bg-[#01502E] text-white' : 'bg-gray-200'}`}
    onClick={() => setActiveTab('hotel')}
  >
    Hotel
  </button>
  <button
    className={`px-4 py-2 rounded ${activeTab === 'carRental' ? 'bg-[#01502E] text-white' : 'bg-gray-200'}`}
    onClick={() => setActiveTab('carRental')}
  >
    Car Rental
  </button>
  <button
    className={`px-4 py-2 rounded ${activeTab === 'tours' ? 'bg-[#01502E] text-white' : 'bg-gray-200'}`}
    onClick={() => setActiveTab('tours')}
  >
    Tours
  </button>
  <button
    className={`px-4 py-2 rounded ${activeTab === 'activities' ? 'bg-[#01502E] text-white' : 'bg-gray-200'}`}
    onClick={() => setActiveTab('activities')}
  >
    Activities
  </button>
</div>

{/* //////hotel/////// */}
      <div className="p-4 bg-white rounded-lg shadow-md">
        {activeTab === 'hotel' && (
          <div lang="en-GB">
            <form method='post' action="/input" className="w-full">
              <input type="hidden" name="formType" value="hotelData" />
              {/* Desktop version - now using flex/grid, not absolute */}
              <div className="hidden md:flex flex-wrap gap-4 items-end justify-center mb-4">
                <input
                  type="text"
                  name='destination'
                  placeholder="Enter destination"
                  className="flex-1 min-w-[180px] max-w-xs p-2 border rounded"
                />
                <div className="flex flex-col">
                  <label className='text-black text-[13px] underline' htmlFor="checkIn">CheckIn</label>
                  <input
                    name='checkIn'
                    placeholder="dd/mm/yyyy"
                    type="date"
                    className="p-2 border rounded min-w-[150px]"
                  />
                </div>
                <div className="flex flex-col">
                  <label className='text-black text-[13px] underline' htmlFor="checkOut">CheckOut</label>
                  <input
                    type="date"
                    name='checkOut'
                    placeholder="dd/mm/yyyy"
                    className="p-2 border rounded min-w-[150px]"
                  />
                </div>
                <input
                  type="number"
                  placeholder="Adults"
                  name='adults'
                  className="w-24 p-2 border border-gray-300 rounded-md"
                />
                <input
                  type="number"
                  placeholder="Childs"
                  name='childs'
                  className="w-24 p-2 border border-gray-300 rounded-md"
                />
                <input
                  type="number"
                  placeholder="Room"
                  name='rooms'
                  className="w-24 p-2 border border-gray-300 rounded-md"
                />
                <button type="submit" className="p-2 text-white bg-[#01502E] rounded min-w-[120px]">Search</button>
              </div>
              {/* Mobile responsive version (unchanged) */}
              <div className="md:hidden flex flex-col gap-2 p-2">
                <input
                  type="text"
                  name='destination'
                  placeholder="Enter application"
                  className="w-full p-2 border rounded"
                />
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className='text-black text-[10px]' htmlFor="checkIn">Check In</label>
                    <input
                      name='checkIn'
                      placeholder="dd/mm/yyyy"
                      type="date"
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div className="flex-1">
                    <label className='text-black text-[10px]' htmlFor="checkOut">Check Out</label>
                    <input
                      type="date"
                      name='checkOut'
                      placeholder="dd/mm/yyyy"
                      className="w-full p-2 border rounded"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    type="number"
                    placeholder="Adults"
                    name='adults'
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                  <input
                    type="number"
                    placeholder="Childs"
                    name='childs'
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                  <input
                    type="number"
                    placeholder="Room"
                    name='rooms'
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <button type="submit" className="w-full p-2 text-white bg-[#01502E] rounded">Search</button>
              </div>
            </form>
          </div>
        )}
{/* /////car////// */}
<div className="p-4 bg-white rounded-lg shadow-md">
  {activeTab === 'carRental' && (
    <div lang="en-GB">
      <form method="post" action="/input" className="w-full">
        <input type="hidden" name="formType" value="carRental" />
        {/* Desktop version - now using flex/grid, not absolute */}
        <div className="hidden md:flex flex-wrap gap-4 items-end justify-center mb-4">
          <input
            type="text"
            name='pickupLocation'
            placeholder="Enter pick-up location"
            className="flex-1 min-w-[180px] max-w-xs p-2 border rounded"
          />
          <div className="flex flex-col">
            <label className='text-black text-[13px] underline' htmlFor="pickupDate">Pick-up Date</label>
            <input
              type="date"
              name='pickupDate'
              className="p-2 border rounded min-w-[150px]"
            />
          </div>
          <div className="flex flex-col">
            <label className='text-black text-[13px] underline' htmlFor="dropoffDate">Drop-off Date</label>
            <input
              type="date"
              name='dropoffDate'
              className="p-2 border rounded min-w-[150px]"
            />
          </div>
          <button
            type="submit"
            className="p-2 text-white bg-[#01502E] rounded min-w-[120px]"
          >
            Search
          </button>
        </div>
        {/* Mobile responsive version (unchanged) */}
        <div className="md:hidden flex flex-col gap-2 p-2">
          <input
            type="text"
            name="pickupLocation"
            placeholder="Enter pick-up location"
            className="w-full p-2 border rounded"
          />
          <div className="flex gap-2">
            <div className="flex-1">
              <label htmlFor="pickupDate" className="text-black text-[10px]">Pick-up Date</label>
              <input
                type="date"
                name="pickupDate"
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="dropoffDate" className="text-black text-[10px]">Drop-off Date</label>
              <input
                type="date"
                name="dropoffDate"
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full p-2 text-white bg-[#01502E] rounded"
          >
            Search
          </button>
        </div>
      </form>
    </div>
  )}
</div>


{activeTab === 'tours' && (
  <div>
    <form method="post" action="/input" className="w-full">
      <input type="hidden" name="formType" value="tour" />
      {/* Desktop version - now using flex/grid, not absolute */}
      <div className="hidden md:flex flex-wrap gap-4 items-end justify-center mb-4">
        <input
          type="text"
          name="location"
          placeholder="Enter location"
          className="flex-1 min-w-[180px] max-w-xs p-2 border rounded"
        />
        <div className="flex flex-col">
          <label className='text-black text-[13px] underline' htmlFor="tourDate">Tour Date</label>
          <input
            type="date"
            name="tourDate"
            className="p-2 border rounded min-w-[150px]"
          />
        </div>
        <button
          type="submit"
          className="p-2 text-white bg-[#01502E] rounded min-w-[120px]"
        >
          Search
        </button>
      </div>
      {/* Mobile responsive version (unchanged) */}
      <div className="md:hidden flex flex-col gap-2 p-2">
        <input
          type="text"
          name="location"
          placeholder="Enter location"
          className="w-full p-2 border rounded"
        />
        <label className='text-[10px]' htmlFor="tourDate">Tour Date</label>
        <input
          type="date"
          name="tourDate"
          className="w-full p-2 border rounded"
        />
        <button
          type="submit"
          className="w-full p-2 text-white bg-[#01502E] rounded"
        >
          Search
        </button>
      </div>
    </form>
  </div>
)}


{activeTab === 'activities' && (
  <div>
    <form method='post' action="/input" className="w-full">
      <input type="hidden" name="formType" value="activity" />
      {/* Desktop version - now using flex/grid, not absolute */}
      <div className="hidden md:flex flex-wrap gap-4 items-end justify-center mb-4">
        <input
          type="text"
          name="activity"
          placeholder="Search for activities"
          className="flex-1 min-w-[180px] max-w-xs p-2 border rounded"
        />
        <div className="flex flex-col">
          <label className='text-black text-[13px] underline' htmlFor="activityDate">Activity Date</label>
          <input
            type="date"
            name="activityDate"
            className="p-2 border rounded min-w-[150px]"
          />
        </div>
        <button
          type="submit"
          className="p-2 text-white bg-[#01502E] rounded min-w-[120px]"
        >
          Search
        </button>
      </div>
      {/* Mobile responsive version (unchanged) */}
      <div className="md:hidden flex flex-col gap-2 p-2">
        <input
          type="text"
          name="activity"
          placeholder="Search for activities"
          className="w-full p-2 border rounded"
        />
        <label className='text-[10px]' htmlFor="activityDate">Activity Date</label>
        <input
          type="date"
          name="activityDate"
          className="w-full p-2 border rounded"
        />
        <button
          type="submit"
          className="w-full p-2 text-white bg-[#01502E] rounded"
        >
          Search
        </button>
      </div>
    </form>
  </div>
)}

      </div>
   

    </div>
    
  );
}





