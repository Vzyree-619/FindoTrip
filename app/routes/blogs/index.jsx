import NavBar from "../../components/navigation/NavBar";
import Landing from "../../components/Blogs/Landing";
import BlogSection from "../../components/Blogs/BlogSection";
import AddPage from "../../components/Blogs/AddPage";
import FAQ from "../../components/RoomPages/Faq";
import SubscriptionForm from "../../components/HomePage/SubscriptionForm";
import Footer from "../../components/Footer";
import { useNavigate } from "@remix-run/react";

export default function Room() {
  const navigate = useNavigate();
  return (
    <>
      <NavBar />

      <Landing />
      {/* <AddPage /> */}
      <BlogSection onReadBlog={(blog) => navigate(`/blog/${blog.id}`)} />
      <FAQ />
      <SubscriptionForm />
      <Footer />
    </>
  );
}
