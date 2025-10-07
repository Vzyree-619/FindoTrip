import Landing from "~/components/features/tours/Landing";
import TourSection from "~/components/features/tours/TourSection";
import OtherTours from "~/components/features/tours/OtherTours";
import { useNavigate } from "@remix-run/react";

export default function Tours() {
  const navigate = useNavigate();
  return (
    <>
      <Landing />
      <TourSection onBookTour={(tour) => navigate(`/tour/${tour.id}`)} />
      <OtherTours />
    </>
  );
}
