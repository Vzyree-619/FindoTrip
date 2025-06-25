// import {  useActionData } from "@remix-run/react";
// import { useState } from "react";
// import { MongoClient, GridFSBucket } from 'mongodb';

// // import { v2 as cloudinary } from "cloudinary";


// // Configure Cloudinary
// // cloudinary.config({
// //   cloud_name: process.env.CLOUDINARY_dbtmbl2lv,
// //   api_key: process.env.CLOUDINARY_146188299796337,
// //   api_secret: process.env.CLOUDINARY_aEErbwaRVlbjPVj4Hqxt3kkpRW8,
// // });

// export default function ExpenseForm() {
// const validationErrors = useActionData();

//   const [previewImages, setPreviewImages] = useState([]);
//   const [iframePreview, setIframePreview] = useState("");

//   const [imageUrls, setImageUrls] = useState([""]); // Initialize with one input field

//   // Handle image URL change
//   const handleImageUrlChange = (index, value) => {
//     const updatedUrls = [...imageUrls];
//     updatedUrls[index] = value;
//     setImageUrls(updatedUrls);
//   };

//   // Add new image URL input field
//   const addImageInput = () => {
//     if (imageUrls.length >= 10) {
//       alert("You can add up to 10 images.");
//       return;
//     }
//     setImageUrls([...imageUrls, ""]);
//   };

//   // Remove an image URL field
//   const removeImageInput = (index) => {
//     if (imageUrls.length === 1) return; // At least one input should remain
//     const updatedUrls = imageUrls.filter((_, i) => i !== index);
//     setImageUrls(updatedUrls);
//   };
  

  



 


  

//   // const handleImageChange = async (event) => {
//   //   const files = Array.from(event.target.files);
//   //   if (files.length < 5) {
//   //     alert("Please upload at least 5 images.");
//   //     return;
//   //   }
  
//   //   const client = new MongoClient(process.env.MONGODB_URI);
//   //   await client.connect();
//   //   const db = client.db("findoDB");
//   //   const bucket = new GridFSBucket(db, { bucketName: "images" });
  
//   //   const imageIds = [];
  
//   //   for (const file of files) {
//   //     const uploadStream = bucket.openUploadStream(file.name);
//   //     const stream = require("stream").Readable.from(file);
//   //     await stream.pipe(uploadStream);
//   //     imageIds.push(uploadStream.id); // Store the GridFS file ID
//   //   }
  
//   //   await client.close();
//   //   setPreviewImages(imageIds); // Store GridFS file IDs for preview
//   // };
  
  
//   // const handleImageChange = async (event) => {
//   //   const files = event.target.files;

//   //   // Validate that at least 5 images are selected
//   //   if (files.length < 5) {
//   //     alert("Please upload at least 5 images.");
//   //     return;
//   //   }

//   //   const uploadedImages = [];

//   //   for (const file of files) {
//   //     const formData = new FormData();
//   //     formData.append("file", file);
//   //     formData.append("upload_preset", "your_upload_preset"); // Replace with your Cloudinary upload preset

//   //     try {
//   //       const response = await fetch("https://api.cloudinary.com/v1_1/dbtmbl2lv/image/upload", {
//   //         method: "POST",
//   //         body: formData,
//   //       });

//   //       if (!response.ok) throw new Error("Image upload failed");

//   //       const data = await response.json();
//   //       uploadedImages.push(data.secure_url); // Store Cloudinary URL
//   //     } catch (error) {
//   //       console.error("Upload Error:", error);
//   //       alert("Failed to upload image. Please try again.");
//   //     }
//   //   }

//   //   setPreviewImages(uploadedImages);

//   //   // Send the image URLs to the backend
//   //   try {
//   //     const response = await fetch("/api/save-hotel", {
//   //       method: "POST",
//   //       headers: {
//   //         "Content-Type": "application/json",
//   //       },
//   //       body: JSON.stringify({
//   //         images: uploadedImages,
//   //         // Include other form data here
//   //       }),
//   //     });

//   //     if (!response.ok) throw new Error("Failed to save data");

//   //     const result = await response.json();
//   //     console.log("Data saved successfully:", result);
//   //   } catch (error) {
//   //     console.error("Error saving data:", error);
//   //   }
//   // };

  
//   const handleIframeChange = (event) => {
//     setIframePreview(event.target.value);

    
//   };

//   return (
//     <div className="max-w-lg p-6 mx-auto mt-10 bg-white rounded-lg shadow-lg">
//       <h1 className="mb-6 text-2xl font-bold text-center">Hotel Registration Form</h1>
//       <form method="post" action="/input"  encType="multipart/form-data"   className="space-y-4">
//         <div>
//         <input type="hidden" name="formType" value="hotel" />
//           <label className="block text-sm font-medium text-gray-700">Hotel Name</label>
//           <input type="text" name="hotelName" className="block w-full p-2 mt-1 border border-gray-300 rounded-md" required />
//         </div>
//         <div>
//           <label className="block text-sm font-medium text-gray-700">Hotel Email</label>
//           <input type="email" name="hotelEmail" className="block w-full p-2 mt-1 border border-gray-300 rounded-md" required />
//         </div>
//         <div>
//           <label className="block text-sm font-medium text-gray-700">Hotel Phone Number</label>
//           <input type="tel" name="hotelPhone" className="block w-full p-2 mt-1 border border-gray-300 rounded-md" required />
//         </div>
//         <div>
//           <label className="block text-sm font-medium text-gray-700">Hotel Website</label>
//           <input type="url" name="hotelWebsite" className="block w-full p-2 mt-1 border border-gray-300 rounded-md" />
//         </div>
//         <div>
//           <label className="block text-sm font-medium text-gray-700">Location</label>
//           <input type="text" name="location" className="block w-full p-2 mt-1 border border-gray-300 rounded-md" required />
//         </div>
//         <div>
//           <label className="block text-sm font-medium text-gray-700">Number of Rooms</label>
//           <input type="number" name="numRooms" className="block w-full p-2 mt-1 border border-gray-300 rounded-md" required />
//         </div>
//         <div>
//           <label className="block text-sm font-medium text-gray-700">Hotel Category</label>
//           <select name="category" className="block w-full p-2 mt-1 border border-gray-300 rounded-md">
//             <option value="1">1 Star</option>
//             <option value="2">2 Stars</option>
//             <option value="3">3 Stars</option>
//             <option value="4">4 Stars</option>
//             <option value="5">5 Stars</option>
//           </select>
//         </div>
//         <div>
//           <label className="block text-sm font-medium text-gray-700">Facilities</label>
//           <div className="grid grid-cols-2 gap-2">
//           <label><input type="checkbox" name="facilities" value="WiFi" /> WiFi</label>
// <label><input type="checkbox" name="facilities" value="Parking" /> Parking</label>
// <label><input type="checkbox" name="facilities" value="Pool" /> Pool</label>
// <label><input type="checkbox" name="facilities" value="Gym" /> Gym</label>
// <label><input type="checkbox" name="facilities" value="Restaurant" /> Restaurant</label>
// <label><input type="checkbox" name="facilities" value="Spa & Wellness Center" /> Spa & Wellness Center</label>
// <label><input type="checkbox" name="facilities" value="Business Center" /> Business Center</label>
// <label><input type="checkbox" name="facilities" value="Airport Shuttle" /> Airport Shuttle</label>
// <label><input type="checkbox" name="facilities" value="Bar/Lounge" /> Bar/Lounge</label>
// <label><input type="checkbox" name="facilities" value="Concierge Service" /> Concierge Service</label>
// <label><input type="checkbox" name="facilities" value="Laundry Service" /> Laundry Service</label>
// <label><input type="checkbox" name="facilities" value="Pet-Friendly Rooms" /> Pet-Friendly Rooms</label>
// <label><input type="checkbox" name="facilities" value="Childcare/Babysitting" /> Childcare/Babysitting</label>
// <label><input type="checkbox" name="facilities" value="Bicycle Rental" /> Bicycle Rental</label>
// <label><input type="checkbox" name="facilities" value="24-hour Front Desk" /> 24-hour Front Desk</label>

//           </div>
//         </div>
//         {/* <div>
//           <label className="block text-sm font-medium text-gray-700">Upload Images</label>
//           <input type="file" name="images" accept="image/*" multiple className="block w-full p-2 mt-1 border border-gray-300 rounded-md" onChange={handleImageChange} required />
//           <p className="mt-1 text-xs text-gray-500">Upload at least 5 images.</p>
//           <div className="grid grid-cols-2 gap-2 mt-2">
//             {previewImages.map((image, index) => (
//               <img key={index} src={image} alt={`Preview ${index + 1}`} className="object-cover w-full h-24 border rounded-md" />
//             ))}
//           </div>
//         </div> */}

// {/* Image URL Input Fields */}
// <div>
//           <label className="block text-sm font-medium text-gray-700">Image URLs</label>
//           {imageUrls.map((url, index) => (
//             <div key={index} className="flex items-center gap-2 mt-2">
//               <input
//                 type="url"
//                 name="images[]"
//                 value={url}
//                 onChange={(e) => handleImageUrlChange(index, e.target.value)}
//                 className="block w-full p-2 border border-gray-300 rounded-md"
//                 placeholder="Paste image URL"
//                 required
//               />
//               <button
//                 type="button"
//                 onClick={() => removeImageInput(index)}
//                 className="p-1 text-white bg-red-500 rounded"
//               >
//                 ✕
//               </button>
//             </div>
//           ))}
//           <button type="button" onClick={addImageInput} className="mt-2 text-blue-500">
//             + Add More Images
//           </button>
//         </div>

//         {/* Preview Images */}
//         <div className="grid grid-cols-2 gap-2 mt-4">
//           {imageUrls.map((url, index) => (
//             url && <img key={index} src={url} alt={`Preview ${index + 1}`} className="object-cover w-full h-24 rounded" />
//           ))}
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-gray-700">Google Maps Embed Iframe</label>
//           <input type="text" name="mapUrl" className="block w-full p-2 mt-1 border border-gray-300 rounded-md" placeholder="Paste the iframe embed code here" onChange={handleIframeChange} required />
//           <p className="mt-1 text-xs text-gray-500">To get the iframe: Open Google Maps, search for your location, click "Share" '' "Embed a map"  Copy the iframe code.</p>
//           {iframePreview && <div className="mt-2 overflow-hidden border rounded-md">{<div dangerouslySetInnerHTML={{ __html: iframePreview }} />}</div>}
//         </div>
//         <div>
//           <label className="block text-sm font-medium text-gray-700">Cancellation Policy</label>
//           <textarea name="cancellationPolicy" className="block w-full p-2 mt-1 border border-gray-300 rounded-md" />
//         </div>
//         <div>
//           <label className="block text-sm font-medium text-gray-700">Suite/Luxury Room Price</label>
//           <input type="number" name="suitePrice" className="block w-full p-2 mt-1 border border-gray-300 rounded-md" required />
//         </div>
//         <div>
//           <label className="block text-sm font-medium text-gray-700">Deluxe Double Room</label>
//           <input type="number" name="DeluxeDouble" className="block w-full p-2 mt-1 border border-gray-300 rounded-md" required />
//         </div>
//         <div>
//           <label className="block text-sm font-medium text-gray-700">Deluxe Twin Room</label>
//           <input type="number" name="DeluxeTwin" className="block w-full p-2 mt-1 border border-gray-300 rounded-md" required />
//         </div>
//         <button type="submit" className="w-full px-4 py-2 font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700">
//           Submit
//         </button>
//       </form>
//     </div>
//   );
// }





import { useActionData } from "@remix-run/react";
import { useState } from "react";

export default function ExpenseForm() {
  const validationErrors = useActionData();

  const [imageUrls, setImageUrls] = useState([""]); // Initialize with one input field

  // Handle image/iframe URL change
  const handleImageUrlChange = (index, value) => {
    const updatedUrls = [...imageUrls];
    updatedUrls[index] = value;
    setImageUrls(updatedUrls);
  };

  // Add new image/iframe URL input field
  const addImageInput = () => {
    if (imageUrls.length >= 10) {
      alert("You can add up to 10 images/iframes.");
      return;
    }
    setImageUrls([...imageUrls, ""]);
  };

  // Remove an image/iframe URL field
  const removeImageInput = (index) => {
    if (imageUrls.length === 1) return; // At least one input should remain
    const updatedUrls = imageUrls.filter((_, i) => i !== index);
    setImageUrls(updatedUrls);
  };

  return (
    <div className="max-w-lg p-6 mx-auto mt-10 bg-white rounded-lg shadow-lg">
      <h1 className="mb-6 text-2xl font-bold text-center">Hotel Registration Form</h1>
      <form method="post" action="/input" encType="multipart/form-data" className="space-y-4">
        <div>
          <input type="hidden" name="formType" value="hotel" />
          <label className="block text-sm font-medium text-gray-700">Hotel Name</label>
          <input type="text" name="hotelName" className="block w-full p-2 mt-1 border border-gray-300 rounded-md" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Hotel Email</label>
          <input type="email" name="hotelEmail" className="block w-full p-2 mt-1 border border-gray-300 rounded-md" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Hotel Phone Number</label>
          <input type="tel" name="hotelPhone" className="block w-full p-2 mt-1 border border-gray-300 rounded-md" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Hotel Website</label>
          <input type="url" name="hotelWebsite" className="block w-full p-2 mt-1 border border-gray-300 rounded-md" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Location</label>
          <input type="text" name="location" className="block w-full p-2 mt-1 border border-gray-300 rounded-md" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Number of Rooms</label>
          <input type="number" name="numRooms" className="block w-full p-2 mt-1 border border-gray-300 rounded-md" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Hotel Category</label>
          <select name="category" className="block w-full p-2 mt-1 border border-gray-300 rounded-md">
            <option value="1">1 Star</option>
            <option value="2">2 Stars</option>
            <option value="3">3 Stars</option>
            <option value="4">4 Stars</option>
            <option value="5">5 Stars</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Facilities</label>
          <div className="grid grid-cols-2 gap-2">
            <label><input type="checkbox" name="facilities" value="WiFi" /> WiFi</label>
            <label><input type="checkbox" name="facilities" value="Parking" /> Parking</label>
            <label><input type="checkbox" name="facilities" value="Pool" /> Pool</label>
            <label><input type="checkbox" name="facilities" value="Gym" /> Gym</label>
            <label><input type="checkbox" name="facilities" value="Restaurant" /> Restaurant</label>
            <label><input type="checkbox" name="facilities" value="Spa & Wellness Center" /> Spa & Wellness Center</label>
            <label><input type="checkbox" name="facilities" value="Business Center" /> Business Center</label>
            <label><input type="checkbox" name="facilities" value="Airport Shuttle" /> Airport Shuttle</label>
            <label><input type="checkbox" name="facilities" value="Bar/Lounge" /> Bar/Lounge</label>
            <label><input type="checkbox" name="facilities" value="Concierge Service" /> Concierge Service</label>
            <label><input type="checkbox" name="facilities" value="Laundry Service" /> Laundry Service</label>
            <label><input type="checkbox" name="facilities" value="Pet-Friendly Rooms" /> Pet-Friendly Rooms</label>
            <label><input type="checkbox" name="facilities" value="Childcare/Babysitting" /> Childcare/Babysitting</label>
            <label><input type="checkbox" name="facilities" value="Bicycle Rental" /> Bicycle Rental</label>
            <label><input type="checkbox" name="facilities" value="24-hour Front Desk" /> 24-hour Front Desk</label>
          </div>
        </div>

        {/* Image/Iframe URL Input Fields */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Image URLs or Embedded Iframes</label>
          {imageUrls.map((url, index) => (
            <div key={index} className="flex items-center gap-2 mt-2">
              <input
                type="text"
                name="images"
                value={url}
                onChange={(e) => handleImageUrlChange(index, e.target.value)}
                className="block w-full p-2 border border-gray-300 rounded-md"
                placeholder="Paste image URL or iframe embed code"
                required
              />
              <button
                type="button"
                onClick={() => removeImageInput(index)}
                className="p-1 text-white bg-red-500 rounded"
              >
                ✕
              </button>
            </div>
          ))}
          <button type="button" onClick={addImageInput} className="mt-2 text-blue-500">
            + Add More Images/Iframes
          </button>
          <p className="mt-1 text-xs text-gray-500">
            For Facebook/Instagram: Click (•••) → Embed → Copy "iframe".
          </p>
        </div>

        {/* Preview Images/Iframes Section */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">Previews</label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {imageUrls.map((url, index) => (
              url ? (
                <div key={index} className="relative">
                  {url.startsWith("<iframe") ? (
                    <div className="w-full h-48 border border-gray-300 rounded-md overflow-hidden">
                      {/* Render iframe directly */}
                      <iframe
                        src={url.match(/src="([^"]+)"/)?.[1] || ""}
                        className="w-full h-full"
                        title={`Iframe ${index + 1}`}
                        frameBorder="0"
                        allowFullScreen
                      />
                      <button
                        type="button"
                        onClick={() => removeImageInput(index)}
                        className="absolute top-0 right-0 p-1 text-white bg-red-500 rounded-full hover:bg-red-600"
                        style={{ transform: "translate(50%, -50%)" }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      {/* Render image */}
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="object-cover w-full h-24 border border-gray-300 rounded-md"
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/150?text=Invalid+URL";
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removeImageInput(index)}
                        className="absolute top-0 right-0 p-1 text-white bg-red-500 rounded-full hover:bg-red-600"
                        style={{ transform: "translate(50%, -50%)" }}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              ) : null
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Google Maps Embed Iframe</label>
          <input type="text" name="mapUrl" className="block w-full p-2 mt-1 border border-gray-300 rounded-md" placeholder="Paste the iframe embed code here" required />
          <p className="mt-1 text-xs text-gray-500">To get the iframe: Open Google Maps, search for your location, click "Share" '' "Embed a map" Copy the iframe code.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Cancellation Policy</label>
          <textarea name="cancellationPolicy" className="block w-full p-2 mt-1 border border-gray-300 rounded-md" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Suite/Luxury Room Price</label>
          <input type="number" name="suitePrice" className="block w-full p-2 mt-1 border border-gray-300 rounded-md" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Deluxe Double Room</label>
          <input type="number" name="DeluxeDouble" className="block w-full p-2 mt-1 border border-gray-300 rounded-md" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Deluxe Twin Room</label>
          <input type="number" name="DeluxeTwin" className="block w-full p-2 mt-1 border border-gray-300 rounded-md" required />
        </div>
        <button type="submit" className="w-full px-4 py-2 font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700">
          Submit
        </button>
      </form>
    </div>
  );
}