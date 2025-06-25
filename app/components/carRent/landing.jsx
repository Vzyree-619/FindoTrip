
export default function Landing(){
    return (
        <>
       <div className=" p-4" >
<img className='w-[100vw] rounded h-[75vh] object-cover object-[50%_35%]' src="carLanding.png" alt="homeImg" />
       </div>
       <div className="p-4 bg-white rounded-lg shadow-md">
  
    <div lang="en-GB">
      <form method="post" action="/input" className="w-full">
        <input type="hidden" name="formType" value="carRental" />

        {/* Desktop version */}
        <div className="hidden md:block">
          <input 
            type="text" 
            name='pickupLocation' 
            placeholder="Enter pick-up location" 
            className="w-[50vw] p-2 mb-2 ml-[20vw] absolute top-[86vh] border rounded" 
          />

          <input 
            type="date" 
            name='pickupDate' 
            className="w-[15vw] p-2 mb-2 border rounded ml-[22.5vw]" 
          />

          <input 
            type="date" 
            name='dropoffDate' 
            className="w-[15vw] p-2 mb-2 border rounded" 
          />

          <button 
            type="submit" 
            className="w-[15vw] p-2 text-white bg-[#01502E] rounded"
          >
            Search
          </button>
        </div>

        {/* Mobile responsive version */}
        <div className="md:hidden flex flex-col gap-2 p-2">
          <input
            type="text"
            name="pickupLocation"
            placeholder="Enter pick-up location"
            className="w-full p-2 border rounded"
          />

          <div className="flex gap-2">
            <div className="flex-1">
              <label htmlFor="pickupDate" className="text-black text-[10px] ">Pick-up Date</label>
              <input
                type="date"
                name="pickupDate"
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="dropoffDate" className="text-black text-[10px] ">Drop-off Date</label>
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
  
</div>
        </>
    )
}