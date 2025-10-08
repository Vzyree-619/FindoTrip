import Landing from "~/components/features/blog/Landing";
import BlogSection from "~/components/features/blog/BlogSection";
import AddPage from "~/components/features/blog/AddPage";
import SubscriptionForm from "~/components/features/home/SubscriptionForm";
import Footer from "~/components/layout/Footer";
import { useNavigate } from "@remix-run/react";

export default function Room() {
  const navigate = useNavigate();
  return (
    <>
      <Landing />
      {/* <AddPage /> */}
      <BlogSection onReadBlog={(blog) => navigate(`/blog/${blog.id}`)} />
      <SubscriptionForm />
      <Footer />
    </>
  );
}
