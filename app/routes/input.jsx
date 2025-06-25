import { redirect } from "@remix-run/node";
import { addActivity, addCarRental, addTour, addData, addHotel } from "../data/input.server";
import { validateFormInput } from "../data/validation.server";
export async function action({ request }) {
  const formData = await request.formData();
  const data = Object.fromEntries(formData);
  data.facilities = formData.getAll("facilities");
  data.images = formData.getAll("images");

   try {
    validateFormInput(data);
  } catch (error) {
    
    return { errors: error };

  }
 
  const { formType } = data;

  console.log("Form Data:", data);

  try {
    switch (formType) {
      case "activity":
        await addActivity(data);
        break;
      case "carRental":
        await addCarRental(data);
        break;
      case "tour":
        await addTour(data);
        break;
      case "hotelData":
        await addData(data);
        break;
        //hotel registration
        case "hotel":
          await addHotel(data); // Added hotel data saving
          break;
  
      default:
        throw new Error("Unknown form type");
    }
  } catch (error) {
    console.error("Error saving data:", error);
    return { error: `Failed to save ${formType} data` };
  }

  return redirect("/");
}
// import { redirect } from "@remix-run/node"; // Import redirect
// import { addActivity, addCarRental, addTour, addData, addHotel } from "../data/input.server";
// import { validateFormInput } from "../data/validation.server";

// export async function action({ request }) {
//   const formData = await request.formData();
//   const data = Object.fromEntries(formData);

//   // Extract facilities and image URLs from form data
//   data.facilities = formData.getAll("facilities");
//   data.images = formData.getAll("images"); // Ensure images is always an array

//   // Validate form input
//   try {
//     validateFormInput(data);
//   } catch (error) {
//     return new Response(JSON.stringify({ errors: error }), {
//       status: 400,
//       headers: {
//         "Content-Type": "application/json",
//       },
//     });
//   }

//   // Determine form type and save to MongoDB
//   const { formType } = data;

//   try {
//     switch (formType) {
//       case "activity":
//         await addActivity(data);
//         break;
//       case "carRental":
//         await addCarRental(data);
//         break;
//       case "tour":
//         await addTour(data);
//         break;
//       case "hotelData":
//         await addData(data);
//         break;
//       case "hotel":
//         await addHotel(data);
//         break;
//       default:
//         throw new Error("Unknown form type");
//     }
//   } catch (error) {
//     console.error("Error saving data:", error);
//     return new Response(JSON.stringify({ error: `Failed to save ${formType} data` }), {
//       status: 500,
//       headers: {
//         "Content-Type": "application/json",
//       },
//     });
//   }

//   return redirect("/");
// }