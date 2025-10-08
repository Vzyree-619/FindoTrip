import { useState } from "react";
import { HiMenu, HiX } from "react-icons/hi";
import Logo from "../util/Logo";

function MainHeader() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="px-6 py-4 flex items-center justify-between md:grid md:grid-cols-[35%_30%_35%]">
      {/* Logo */}
      <Logo />

      {/* Mobile Menu Button */}
      <button
        className="md:hidden text-primary-100 text-2xl"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <HiX /> : <HiMenu />}
      </button>

      {/* Navigation Links (Hidden on mobile by default) */}
      <nav
        className={`absolute top-16 left-0 w-full bg-gray-900 md:bg-transparent md:static md:w-auto md:flex md:items-center md:gap-8 ${
          isOpen ? "block" : "hidden"
        }`}
      >
        <ul className="flex flex-col items-center gap-4 md:flex-row md:gap-8 p-4 md:p-0">
          <li>
            <a href="/user" className="text-primary-100 hover:text-primary-10">
              User
            </a>
          </li>
          <li>
            <a href="/add" className="text-primary-100 hover:text-primary-10">
              Add
            </a>
          </li>
          <li>
            <a href="/edit" className="text-primary-100 hover:text-primary-10">
              Edit
            </a>
          </li>
          <li>
            <a href="/hotelPage" className="text-primary-100 hover:text-primary-10">
              hotelPage
            </a>
          </li>
          <li>
            <a href="/hotelList" className="text-primary-100 hover:text-primary-10">
              hotelList
            </a>
          </li>
        </ul>
      </nav>

      {/* CTA (Login Button) */}
      <nav className="hidden md:block justify-self-end">
        <ul>
          <li>
            <a
              href="/auth"
              className="inline-flex items-center gap-2 px-6 py-2 bg-secondary-500 text-primary-10 rounded-full shadow-md hover:bg-secondary-600"
            >
              Login
            </a>
          </li>
        </ul>
      </nav>
    </header>
  );
}

export default MainHeader;
