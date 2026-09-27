import { Link } from "react-router-dom";

interface NotFoundProps {
  title?: string;
}

function NotFound({ title = "Page not found" }: NotFoundProps) {
  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-3xl font-bold">{title}</h1>

      <p className="mt-4">
        We couldn't find what you were looking for.{" "}
        <Link className="font-medium underline" to="/">
          Go back home
        </Link>
      </p>
    </main>
  );
}

export default NotFound;
