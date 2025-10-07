import { useParams } from "@remix-run/react";
import NavBar from "~/components/layout/navigation/NavBar";
import { useState } from "react";

const blogs = [
  {
    id: 1,
    title: "Discover the Hidden Valleys of Baltistan",
    content:
      "Explore the untouched beauty of Baltistan, from lush valleys to snow-capped peaks. Adventure awaits you around every corner.",
    image: "/basho.jpg",
  },
  {
    id: 2,
    title: "Cultural Wonders of Baltistan",
    content:
      "Dive deep into the rich culture and traditions that have been preserved for centuries in the breathtaking landscapes of Baltistan.",
    image: "/skdu.jpg",
  },
  {
    id: 3,
    title: "Top Trekking Trails You Must Explore",
    content:
      "Baltistan offers some of the world's best trekking routes. Get ready to embark on trails that offer surreal views and thrilling experiences.",
    image: "/shigerlack.jpg",
  },
  {
    id: 4,
    title: "Experience the Warm Hospitality",
    content:
      "Meet the warm-hearted locals and experience true Baltistani hospitality. Their stories and traditions will stay with you forever.",
    image: "/khaplu.jpg",
  },
];

const lorem = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, nunc ut laoreet dictum, massa erat cursus enim, nec dictum ex enim nec urna. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vivamus euismod, urna eu tincidunt consectetur, nisi nisl aliquam nunc, eget aliquam massa nisl quis neque. Etiam euismod, urna eu tincidunt consectetur, nisi nisl aliquam nunc, eget aliquam massa nisl quis neque.\n\nPhasellus euismod, urna eu tincidunt consectetur, nisi nisl aliquam nunc, eget aliquam massa nisl quis neque. Etiam euismod, urna eu tincidunt consectetur, nisi nisl aliquam nunc, eget aliquam massa nisl quis neque. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.`;

const dummyComments = [
  {
    user: "Ayesha",
    text: "Great blog! Very informative.",
    avatar: "/dummy/ayesha.jpg",
  },
  {
    user: "Usman",
    text: "Loved the pictures and details.",
    avatar: "/dummy/usman.jpg",
  },
  {
    user: "Fatima",
    text: "Looking forward to visiting Baltistan!",
    avatar: "/dummy/fatima.jpg",
  },
];

export default function BlogDetails() {
  const { id } = useParams();
  const blog = blogs.find((b) => b.id === Number(id));
  const [comments, setComments] = useState(dummyComments);
  const [commentInput, setCommentInput] = useState("");

  if (!blog) return <div className="p-8">Blog not found.</div>;

  const handleComment = () => {
    if (commentInput.trim()) {
      setComments([
        ...comments,
        { user: "You", text: commentInput, avatar: "/dummy/you.png" },
      ]);
      setCommentInput("");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-lg shadow p-6 md:p-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 flex flex-col">
            <img
              src={blog.image}
              alt={blog.title}
              className="w-full h-64 md:h-80 object-cover rounded mb-6"
            />
            <h1 className="text-3xl font-bold mb-4">{blog.title}</h1>
            <div className="prose max-w-none mb-6 text-gray-800">
              <p>{blog.content}</p>
              <p>{lorem}</p>
              <p>{lorem}</p>
            </div>
            {/* Comment Section */}
            <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Comments</h2>
              <div className="space-y-4 mb-4">
                {comments.map((c, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <img
                      src={c.avatar}
                      alt={c.user}
                      className="w-10 h-10 rounded-full object-cover border"
                    />
                    <div>
                      <div className="font-semibold">{c.user}</div>
                      <div className="text-gray-700">{c.text}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 mt-4">
                <input
                  type="text"
                  className="flex-1 border rounded px-3 py-2"
                  placeholder="Add a comment..."
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleComment()}
                />
                <button
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  onClick={handleComment}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
          <div className="lg:col-span-1 flex flex-col gap-6 mt-8 lg:mt-0">
            <div className="bg-gray-100 border border-gray-200 rounded-lg p-6 flex items-center justify-center min-h-[200px]">
              <span className="text-gray-400 text-center">
                Google Ad Placeholder
                <br />
                300x250
              </span>
            </div>
            {/* You can add more ad boxes or widgets here */}
          </div>
        </div>
      </div>
    </div>
  );
}
