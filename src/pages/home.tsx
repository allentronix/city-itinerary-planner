import cities from "../data/cities";
import CityCard from "../components/city-card";

function Home() {
  return (
    <main className="p-6">
      <h1 className="mb-6 text-3xl font-bold">City Itinerary Planner</h1>

      <div className="grid gap-4 md:grid-cols-2">
        {cities.map((city) => (
          <CityCard
            key={city.id}
            id={city.id}
            name={city.name}
            country={city.country}
            placeCount={city.places.length}
          />
        ))}
      </div>
    </main>
  );
}

export default Home;