
export default function Room(){
    return (
        <>
       <div className=" p-4" >
<img className='w-[100vw] rounded h-[75vh] object-cover object-[50%_35%]' src="homePage.png" alt="homeImg" />
       </div>
       <div  lang="en-GB" className="">
            {/* <h2 className="mb-2 text-lg font-semibold">Hotel Booking</h2> */}
            <form method='post' action="/input" className="w-full">
  <input type="hidden" name="formType" value="hotelData" />
  
 
  <div className="hidden md:block">
    <input 
      type="text" 
      name='destination' 
      placeholder="Enter destination" 
      className="w-[50vw] p-2 mb-2 ml-[18.4vw] absolute top-[84.5vh] border rounded " 
    />
    
    <label className='text-black ml-[12vw] text-[13px] underline' htmlFor="checkIn">CheckIn</label>
    <input 
      name='checkIn' 
      placeholder="dd/mm/yyyy" 
      type="date" 
      className="w-[15vw] p-2 mb-2 border rounded" 
    />
    
    <label className='text-black text-[13px] underline' htmlFor="checkOut">CheckOut</label>
    <input 
      type="date" 
      name='checkOut' 
      placeholder="dd/mm/yyyy" 
      className="p-2 mb-2 border rounded w-[15vw]" 
    />
    
    <input
      type="number"
      placeholder="Adults"
      name='adults'
      className="w-[10vw] p-2 border border-gray-300 rounded-md"
    />
    <input
      type="number"
      placeholder="Childs"
      name='childs'
      className="w-[10vw] p-2 border border-gray-300 rounded-md"
    />
    <input
      type="number"
      placeholder="Room"
      name='rooms'
      className="w-[10vw] p-2 border border-gray-300 rounded-md"
    />
    
    <button type="submit" className="w-[10vw] p-2 text-white bg-[#01502E] rounded  absolute top-[84.6vh] right-[21.5vw]">Search</button>
  </div>

  {/* Mobile responsive version (hidden on desktop) */}
  <div className="md:hidden flex flex-col gap-2 p-2">
    <input 
      type="text" 
      name='destination' 
      placeholder="Enter application" 
      className="w-full p-2 border rounded" 
    />
    
    <div className="flex gap-2">
      <div className="flex-1">
        <label className='text-black text-[10px] ' htmlFor="checkIn">Check In</label>
        <input 
          name='checkIn' 
          placeholder="dd/mm/yyyy" 
          type="date" 
          className="w-full p-2 border rounded" 
        />
      </div>
      
      <div className="flex-1">
        <label className='text-black text-[10px] ' htmlFor="checkOut">Check Out</label>
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
    
    <button type="submit" className="w-full  p-3 text-white bg-[#01502E] rounded">Search</button>
  </div>
</form>
          </div>
        </>
    )
}