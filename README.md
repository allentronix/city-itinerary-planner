# ItiPlanner

A small web app for planning a city trip day by day. Pick a city and how long you're staying, then build a schedule of places to visit.

## Features

- **Choose a destination:** 10 cities (Budapest, Rome, Paris, London, Barcelona, New York, Tokyo, Istanbul, Prague, Athens), each with curated sights, restaurants and coffee shops, and the best time to visit them.
- **Set your trip dates:** pick your start and end dates from a calendar (up to 30 days). You can edit the dates later, and any activities that fall outside the new range are removed after you confirm.
- **Schedule places:** pick a trip day, start time, duration and travel time afterwards. The start time is pre-filled from the place's best time to visit, or the next free slot.
- **Conflict checks:** start times that would clash are greyed out, and the app stops you from:
  - adding a sight more than once, or a restaurant or coffee shop more than once on the same day
  - scheduling activities that overlap
  - scheduling an activity (plus its travel time) that runs past midnight
- **Filter places:** show all places, only those not added yet, sights, restaurants, coffee shops, or morning, afternoon or evening spots.
- **Day-by-day itinerary:** a summary of how many days are planned, then activities grouped by day and sorted by time, with the travel time and free time between stops shown. You can edit or remove any activity (removing asks you to confirm).

- **Save trips:** press **Save trip** under your itinerary to keep it in **My trips**. After that, every change saves automatically, and you can start planning another trip without losing it. Leaving a trip you haven't saved asks you to confirm first.

Saved trips are stored in your browser (`localStorage`), so they stay on this device and browser only.

## Tech stack

React 19, TypeScript, Vite, React Router, Tailwind CSS v4 and shadcn/ui.

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check and build for production
npm run preview  # preview the production build
npm run lint     # run ESLint
```

## Project structure

```
src/
  pages/        Home, City and About pages
  components/   Trip form, place cards, itinerary view, navbar, UI primitives
  data/         City and place data, shared types
  utils/        Date and time helpers
```

## Credits

City banner photos are from [Unsplash](https://unsplash.com) and used under the [Unsplash License](https://unsplash.com/license):

- Budapest: [Ervin Lukacs](https://unsplash.com/@lukerv4)
- Rome: [David Köhler](https://unsplash.com/@davidkhlr)
- Paris: [Chris Karidis](https://unsplash.com/@chriskaridis)
- London: [Jacob Diehl](https://unsplash.com/@jacob_diehl_film)
- Barcelona: [Colin + Meg](https://unsplash.com/@colinandmeg)
- New York: [Luca Bravo](https://unsplash.com/@lucabravo)
- Tokyo: [Louie Martinez](https://unsplash.com/@thetalkinglens)
- Istanbul: [Ibrahim Uzun](https://unsplash.com/@ibuzn)
- Prague: [William Zhang](https://unsplash.com/@ceye2eye)
- Athens: [Constantinos Kollias](https://unsplash.com/@ckollias)
