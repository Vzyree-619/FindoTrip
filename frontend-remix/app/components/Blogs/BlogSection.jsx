// app/components/BlogSection.jsx
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import PropTypes from "prop-types";

const blogPosts = [
  {
    id: 1,
    title: "Discover the Hidden Valleys of Baltistan",
    excerpt: "Explore the untouched beauty of Baltistan, from lush valleys to snow-capped peaks. Adventure awaits you around every corner.",
    image: "/basho.jpg",
  },
  {
    id: 2,
    title: "Cultural Wonders of Baltistan",
    excerpt: "Dive deep into the rich culture and traditions that have been preserved for centuries in the breathtaking landscapes of Baltistan.",
    image: "/skdu.jpg",
  },
  {
    id: 3,
    title: "Top Trekking Trails You Must Explore",
    excerpt: "Baltistan offers some of the world's best trekking routes. Get ready to embark on trails that offer surreal views and thrilling experiences.",
    image: "/shigerlack.jpg",
  },
  {
    id: 4,
    title: "Experience the Warm Hospitality",
    excerpt: "Meet the warm-hearted locals and experience true Baltistani hospitality. Their stories and traditions will stay with you forever.",
    image: "/khaplu.jpg",
  },
];

export default function BlogSection({ onReadBlog }) {
    const cardsRef = useRef([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedBlog, setSelectedBlog] = useState(null);
  
    useEffect(() => {
      cardsRef.current.forEach((card) => {
        if (card) {
          gsap.set(card, { scale: 1 });
  
          card.addEventListener("mouseenter", () => {
            gsap.to(card, { scale: 1.03, duration: 0.5, ease: "power2.out" });
          });
  
          card.addEventListener("mouseleave", () => {
            gsap.to(card, { scale: 1, duration: 0.5, ease: "power2.out" });
          });
        }
      });
    }, []);
  
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl md:text-4xl font-semibold text-center mb-8">Blogs</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post, index) => (
            <div
              key={post.id}
              ref={(el) => (cardsRef.current[index] = el)}
              className="bg-white rounded-2xl shadow-lg overflow-hidden transform transition-transform duration-300 cursor-pointer h-full flex flex-col"
              onClick={() => onReadBlog && onReadBlog(post)}
            >
              <div className="w-full h-56 sm:h-48 md:h-56 lg:h-64 overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
                <p className="text-gray-600">{post.excerpt}</p>
              </div>
            </div>
          ))}
        </div>
        {modalOpen && selectedBlog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
            <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-lg relative">
              <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-800" onClick={() => setModalOpen(false)}>&times;</button>
              <h2 className="text-2xl font-bold mb-4">{selectedBlog.title}</h2>
              <img src={selectedBlog.image} alt={selectedBlog.title} className="w-full h-40 object-cover rounded mb-4" />
              <p className="mb-2">{selectedBlog.excerpt}</p>
              <button className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 mt-4" onClick={() => setModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        )}
      </section>
    );
  }

BlogSection.propTypes = {
  onReadBlog: PropTypes.func,
};