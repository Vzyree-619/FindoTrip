import { redirect } from "@remix-run/node";
import {
  addActivity,
  addCarRental,
  addTour,
  addData,
  addHotel,
} from "../../data/input.server";
import { validateFormInput } from "../../data/validation.server";
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
