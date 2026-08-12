export interface Place {
  id: string;
  name: string;
  description: string;
  bestTime: string;
}

export interface City {
  id: string;
  name: string;
  country: string;
  places: Place[];
}

const cities: City[] = [
  {
    id: "budapest",
    name: "Budapest",
    country: "Hungary",
    places: [
      {
        id: "parliament",
        name: "Hungarian Parliament Building",
        description:
          "A famous riverside landmark known for its impressive architecture.",
        bestTime: "Early morning",
      },
      {
        id: "buda-castle",
        name: "Buda Castle",
        description: "A historic castle complex with views across Budapest.",
        bestTime: "Late afternoon",
      },
    ],
  },
  {
    id: "rome",
    name: "Rome",
    country: "Italy",
    places: [
      {
        id: "colosseum",
        name: "Colosseum",
        description:
          "An ancient amphitheater famous for its historic arena and grand architecture.",
        bestTime: "Early morning",
      },
      {
        id: "trevi-fountain",
        name: "Trevi Fountain",
        description: "A landmark fountain known for its beautiful stone detail and coins.",
        bestTime: "Late evening",
      },
    ],
  },
];

export default cities;
