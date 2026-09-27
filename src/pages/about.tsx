import { Link } from "react-router-dom";
import PageBanner from "../components/page-banner";
import { buttonVariants } from "../components/ui/button";

const FEATURES = [
  {
    title: "Pick your dates",
    description:
      "Choose a city and your travel dates, and ItiPlanner lays out every day of your trip.",
  },
  {
    title: "Build each day",
    description:
      "Add sights, restaurants and coffee shops, with start times suggested from the best time to visit.",
  },
  {
    title: "No double-booking",
    description:
      "Times that clash are greyed out, and travel and free time between stops are worked out for you.",
  },
];

function About() {
  return (
    <>
      <PageBanner eyebrow="About" title="About ItiPlanner" />

      <main className="mx-auto max-w-6xl px-6 py-12">
        <p className="max-w-2xl text-lg text-slate-600">
          ItiPlanner was built to make planning a trip easier. It helps you
          discover places to visit and organize your time so you can get the
          most out of your visit to a city.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <div key={feature.title} className="border bg-white p-6">
              <p className="text-xs font-medium tracking-wider text-emerald-700 uppercase">
                Step {index + 1}
              </p>

              <h2 className="mt-1 font-serif text-2xl">{feature.title}</h2>

              <p className="mt-2 text-sm text-slate-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <Link
          to="/"
          className={buttonVariants({ className: "mt-10 h-12 px-8 text-base" })}
        >
          Start planning
        </Link>
      </main>
    </>
  );
}

export default About;
