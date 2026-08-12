import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="border-b p-4">
      <div className="mx-auto flex max-w-5xl gap-6">
        <Link className="font-medium hover:underline" to="/">
          Home
        </Link>

        <Link className="font-medium hover:underline" to="/about">
          About
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;