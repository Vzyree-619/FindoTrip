//validation.server.js

// Helper functions for validation
function isValidText(text) {
  return typeof text === 'string' && text.length > 0 && text.length <= 30;
}

function isValidDate(date) {
  const parsedDate = new Date(date);
  return !isNaN(parsedDate) && parsedDate >= new Date();
}

function isValidNumber(num) {
  const parsed = parseInt(num, 10);
  return !isNaN(parsed) && parsed > 0;
}

function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
  return typeof phone === "string" && /^[0-9]{10,15}$/.test(phone);
}

function isValidNumber(num, min = 1) {
  const parsed = parseInt(num, 10);
  return !isNaN(parsed) && parsed >= min;
}

function isValidFloat(num, min = 0) {
  const parsed = parseFloat(num);
  return !isNaN(parsed) && parsed >= min;
}

function isValidUrl(url) {
  return typeof url === "string" && /^https?:\/\/[^\s/$.?#].[^\s]*$/.test(url);
}

function isValidArray(arr) {
  return Array.isArray(arr) && arr.length > 0 && arr.every((item) => typeof item === "string" && item.trim().length > 0);
}

// Main validation function
export function validateFormInput(input) {
  const errors = {};
  const { formType } = input;

  if (!formType) {
    return { formType: "Form type is missing" };
  }

  switch (formType) {
    case "hotelData":
      if (!isValidText(input.destination)) {
        errors.destination = "Invalid destination. Must be at most 30 characters.";
      }
      if (!isValidDate(input.checkIn)) {
        errors.checkIn = "Invalid check-in date. Must be today or later.";
      }
      if (!isValidDate(input.checkOut) || new Date(input.checkOut) <= new Date(input.checkIn)) {
        errors.checkOut = "Invalid check-out date. Must be after check-in date.";
      }
      if (!isValidNumber(input.adults)) {
        errors.adults = "Invalid number of adults. Must be a positive number.";
      }
      if (input.childs !== undefined && (isNaN(input.childs) || input.childs < 0)) {
        errors.childs = "Invalid number of children. Must be zero or greater.";
      }
      if (!isValidNumber(input.rooms)) {
        errors.rooms = "Invalid number of rooms. Must be a positive number.";
      }
      break;

    case "carRental":
      if (!isValidText(input.pickupLocation)) {
        errors.pickupLocation = "Invalid pick-up location. Must be at most 30 characters.";
      }
      if (!isValidDate(input.pickupDate)) {
        errors.pickupDate = "Invalid pick-up date. Must be today or later.";
      }
      if (!isValidDate(input.dropoffDate) || new Date(input.dropoffDate) <= new Date(input.pickupDate)) {
        errors.dropoffDate = "Invalid drop-off date. Must be after pick-up date.";
      }
      break;

    case "tour":
      if (!isValidText(input.location)) {
        errors.location = "Invalid location. Must be at most 30 characters.";
      }
      if (!isValidDate(input.tourDate)) {
        errors.tourDate = "Invalid tour date. Must be today or later.";
      }
      break;

    case "activity":
      if (!isValidText(input.activity)) {
        errors.activity = "Invalid activity name. Must be at most 30 characters.";
      }
      if (!isValidDate(input.activityDate)) {
        errors.activityDate = "Invalid activity date. Must be today or later.";
      }
      break;
///registeration form validation
      case "hotel":
        if (!isValidText(input.hotelName, 5)) {
          errors.hotelName = "Invalid hotel name. Must be at most 5 characters.";
        }
        if (!isValidEmail(input.hotelEmail)) {
          errors.hotelEmail = "Invalid email format.";
        }
        if (!isValidPhone(input.hotelPhone)) {
          errors.hotelPhone = "Invalid phone number. Must be 10-15 digits.";
        }
        if (input.hotelWebsite && !isValidUrl(input.hotelWebsite)) {
          errors.hotelWebsite = "Invalid website URL.";
        }
        if (!isValidText(input.location, 100)) {
          errors.location = "Invalid location. Must be at most 100 characters.";
        }
        if (!isValidNumber(input.numRooms)) {
          errors.numRooms = "Invalid number of rooms. Must be a positive number.";
        }
        if (!isValidNumber(input.category)) {
          errors.category = "Invalid category. Must be a positive integer.";
        }
        if (!isValidArray(input.facilities)) {
          errors.facilities = "Invalid facilities. Must be a non-empty array of strings.";
        }
        if (!isValidArray(input.images)) {
          errors.images = "Invalid images. Must be a non-empty array of URLs.";
        }
        if (!isValidUrl(input.mapUrl)) {
          errors.mapUrl = "Invalid map URL.";
        }
        if (input.cancellationPolicy && !isValidText(input.cancellationPolicy, 200)) {
          errors.cancellationPolicy = "Invalid cancellation policy. Must be at most 200 characters.";
        }
        if (!isValidFloat(input.suitePrice)) {
          errors.suitePrice = "Invalid suite price. Must be a non-negative number.";
        }
        if (!isValidFloat(input.deluxeDouble)) {
          errors.deluxeDouble = "Invalid deluxe double price. Must be a non-negative number.";
        }
        if (!isValidFloat(input.deluxeTwin)) {
          errors.deluxeTwin = "Invalid deluxe twin price. Must be a non-negative number.";
        }
        break;

    default:
      return { formType: "Unknown form type." };
  }

  // Return errors if any exist
  return Object.keys(errors).length > 0 ? errors : null;
}

