import { Link } from "react-router-dom";

interface CityCardProps {
  id: string;
  name: string;
  country: string;
  placeCount: number;
}

function CityCard({ id, name, country, placeCount }: CityCardProps) {
  return (
    <Link to={`/city/${id}`}>
      <div className="max-w-sm rounded-lg border p-6 shadow-sm">
        <h2 className="text-xl font-bold">{name}</h2>
        <p>{country}</p>
        <p>{placeCount} places</p>
      </div>
    </Link>
  );
}

export default CityCard;
