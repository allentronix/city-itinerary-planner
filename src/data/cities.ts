import type { City } from "./types";

const cities: City[] = [
  {
    id: "budapest",
    name: "Budapest",
    country: "Hungary",
    image: "/cities/budapest.webp",
    photoCredit: "Ervin Lukacs",
    places: [
      {
        id: "parliament",
        name: "Hungarian Parliament Building",
        category: "attraction",
        description:
          "A famous riverside landmark known for its impressive architecture.",
        bestTime: "Early morning",
        lat: 47.50694,
        lon: 19.04556,
      },
      {
        id: "buda-castle",
        name: "Buda Castle",
        category: "attraction",
        description: "A historic castle complex with views across Budapest.",
        bestTime: "Late afternoon",
        lat: 47.49611,
        lon: 19.03972,
      },
      {
        id: "fishermans-bastion",
        name: "Fisherman's Bastion",
        category: "attraction",
        description:
          "A neo-Gothic terrace with panoramic views over the Danube and Pest.",
        bestTime: "Sunset",
        lat: 47.50222,
        lon: 19.03472,
      },
      {
        id: "szechenyi-baths",
        name: "Széchenyi Thermal Baths",
        category: "attraction",
        description:
          "A large spa complex with outdoor thermal pools in City Park.",
        bestTime: "Morning",
        lat: 47.51833,
        lon: 19.08222,
      },
      {
        id: "gundel",
        name: "Gundel",
        category: "restaurant",
        description:
          "A historic fine-dining restaurant next to City Park, known for classic Hungarian dishes and the Gundel pancake.",
        bestTime: "Dinner",
        lat: 47.51685,
        lon: 19.07619,
      },
      {
        id: "borkonyha",
        name: "Borkonyha Winekitchen",
        category: "restaurant",
        description:
          "A Michelin-starred wine bistro serving modern Hungarian food with a long list of local wines.",
        bestTime: "Dinner",
        lat: 47.4996,
        lon: 19.0525,
      },
      {
        id: "new-york-cafe",
        name: "New York Café",
        category: "cafe",
        description:
          "An opulent 19th-century grand café, often called one of the most beautiful cafés in the world.",
        bestTime: "Morning",
        lat: 47.49868,
        lon: 19.07046,
      },
      {
        id: "gerbeaud",
        name: "Gerbeaud",
        category: "cafe",
        description:
          "A classic coffee house and confectionery on Vörösmarty Square, famous for its cakes.",
        bestTime: "Afternoon",
        lat: 47.49708,
        lon: 19.05038,
      },
    ],
  },
  {
    id: "rome",
    name: "Rome",
    country: "Italy",
    image: "/cities/rome.webp",
    photoCredit: "David K\u00f6hler",
    places: [
      {
        id: "colosseum",
        name: "Colosseum",
        category: "attraction",
        description:
          "An ancient amphitheater famous for its historic arena and grand architecture.",
        bestTime: "Early morning",
        lat: 41.89028,
        lon: 12.49222,
      },
      {
        id: "trevi-fountain",
        name: "Trevi Fountain",
        category: "attraction",
        description:
          "A landmark fountain known for its beautiful stone detail and coins.",
        bestTime: "Late evening",
        lat: 41.90093,
        lon: 12.48331,
      },
      {
        id: "pantheon",
        name: "Pantheon",
        category: "attraction",
        description:
          "A remarkably preserved Roman temple with a vast concrete dome.",
        bestTime: "Late morning",
        lat: 41.89861,
        lon: 12.47694,
      },
      {
        id: "vatican-museums",
        name: "Vatican Museums",
        category: "attraction",
        description: "A vast museum complex that includes the Sistine Chapel.",
        bestTime: "Early morning",
        lat: 41.90639,
        lon: 12.45444,
      },
      {
        id: "roscioli",
        name: "Roscioli Salumeria con Cucina",
        category: "restaurant",
        description:
          "A deli and restaurant near Campo de' Fiori, known for carbonara, cured meats and cheeses.",
        bestTime: "Dinner",
        lat: 41.89422,
        lon: 12.47426,
      },
      {
        id: "da-enzo",
        name: "Da Enzo al 29",
        category: "restaurant",
        description:
          "A small, popular trattoria in Trastevere serving traditional Roman dishes.",
        bestTime: "Lunch",
        lat: 41.88809,
        lon: 12.47781,
      },
      {
        id: "sant-eustachio",
        name: "Sant'Eustachio Il Caffè",
        category: "cafe",
        description:
          "A historic coffee bar near the Pantheon, famous for its creamy espresso.",
        bestTime: "Morning",
        lat: 41.89825,
        lon: 12.47543,
      },
      {
        id: "tazza-doro",
        name: "Tazza d'Oro",
        category: "cafe",
        description:
          "A coffee roaster steps from the Pantheon, known for its granita di caffè.",
        bestTime: "Afternoon",
        lat: 41.89959,
        lon: 12.47749,
      },
    ],
  },
  {
    id: "paris",
    name: "Paris",
    country: "France",
    image: "/cities/paris.webp",
    photoCredit: "Chris Karidis",
    places: [
      {
        id: "eiffel-tower",
        name: "Eiffel Tower",
        category: "attraction",
        description:
          "The city's iron landmark with views across Paris from its decks.",
        bestTime: "Sunset",
        lat: 48.8583,
        lon: 2.29448,
      },
      {
        id: "louvre",
        name: "Louvre Museum",
        category: "attraction",
        description:
          "A former palace that now holds one of the world's largest art collections.",
        bestTime: "Early morning",
        lat: 48.86111,
        lon: 2.33583,
      },
      {
        id: "notre-dame",
        name: "Notre-Dame Cathedral",
        category: "attraction",
        description:
          "A Gothic cathedral on the Île de la Cité, known for its façade and rose windows.",
        bestTime: "Morning",
        lat: 48.853,
        lon: 2.3498,
      },
      {
        id: "sacre-coeur",
        name: "Sacré-Cœur",
        category: "attraction",
        description:
          "A white basilica on Montmartre hill with wide views over the city.",
        bestTime: "Late afternoon",
        lat: 48.88665,
        lon: 2.34295,
      },
      {
        id: "bouillon-chartier",
        name: "Bouillon Chartier",
        category: "restaurant",
        description:
          "A bustling Belle Époque dining hall serving affordable French classics since 1896.",
        bestTime: "Dinner",
        lat: 48.87194,
        lon: 2.34301,
      },
      {
        id: "relais-entrecote",
        name: "Le Relais de l'Entrecôte",
        category: "restaurant",
        description:
          "A no-menu steak-frites restaurant famous for its secret green sauce.",
        bestTime: "Lunch",
        lat: 48.85464,
        lon: 2.33277,
      },
      {
        id: "cafe-de-flore",
        name: "Café de Flore",
        category: "cafe",
        description:
          "A legendary Saint-Germain café once frequented by writers and artists.",
        bestTime: "Morning",
        lat: 48.85414,
        lon: 2.33263,
      },
      {
        id: "les-deux-magots",
        name: "Les Deux Magots",
        category: "cafe",
        description:
          "A historic café on Saint-Germain-des-Prés with a classic terrace for people-watching.",
        bestTime: "Afternoon",
        lat: 48.85407,
        lon: 2.33306,
      },
    ],
  },
  {
    id: "london",
    name: "London",
    country: "United Kingdom",
    image: "/cities/london.webp",
    photoCredit: "Jacob Diehl",
    places: [
      {
        id: "tower-of-london",
        name: "Tower of London",
        category: "attraction",
        description:
          "A historic fortress on the Thames, home to the Crown Jewels.",
        bestTime: "Morning",
        lat: 51.5082,
        lon: -0.0762,
      },
      {
        id: "british-museum",
        name: "British Museum",
        category: "attraction",
        description:
          "A major museum of world history and culture, including the Rosetta Stone.",
        bestTime: "Early morning",
        lat: 51.51944,
        lon: -0.12694,
      },
      {
        id: "big-ben",
        name: "Big Ben and the Houses of Parliament",
        category: "attraction",
        description:
          "London's clock tower and the riverside home of the UK Parliament.",
        bestTime: "Late afternoon",
        lat: 51.50067,
        lon: -0.12457,
      },
      {
        id: "westminster-abbey",
        name: "Westminster Abbey",
        category: "attraction",
        description:
          "A Gothic church used for royal ceremonies and historic burials.",
        bestTime: "Morning",
        lat: 51.4994,
        lon: -0.12737,
      },
      {
        id: "dishoom",
        name: "Dishoom Covent Garden",
        category: "restaurant",
        description:
          "A Bombay-style café restaurant known for its black daal and bacon naan rolls.",
        bestTime: "Dinner",
        lat: 51.51243,
        lon: -0.12686,
      },
      {
        id: "rules",
        name: "Rules",
        category: "restaurant",
        description:
          "London's oldest restaurant, serving traditional British game, pies and puddings since 1798.",
        bestTime: "Dinner",
        lat: 51.51083,
        lon: -0.12319,
      },
      {
        id: "monmouth-coffee",
        name: "Monmouth Coffee",
        category: "cafe",
        description:
          "A much-loved coffee roaster by Borough Market, known for its filter coffee.",
        bestTime: "Morning",
        lat: 51.5055,
        lon: -0.09143,
      },
      {
        id: "bar-italia",
        name: "Bar Italia",
        category: "cafe",
        description:
          "An iconic Soho espresso bar that has been open since 1949.",
        bestTime: "Afternoon",
        lat: 51.51342,
        lon: -0.13124,
      },
    ],
  },
  {
    id: "barcelona",
    name: "Barcelona",
    country: "Spain",
    image: "/cities/barcelona.webp",
    photoCredit: "Colin + Meg",
    places: [
      {
        id: "sagrada-familia",
        name: "Sagrada Família",
        category: "attraction",
        description:
          "Gaudí's unfinished basilica, known for its towers and stained glass.",
        bestTime: "Morning",
        lat: 41.40369,
        lon: 2.17433,
      },
      {
        id: "park-guell",
        name: "Park Güell",
        category: "attraction",
        description:
          "A hillside park with mosaic benches, pavilions, and city views.",
        bestTime: "Early morning",
        lat: 41.41361,
        lon: 2.15278,
      },
      {
        id: "la-rambla",
        name: "La Rambla",
        category: "attraction",
        description:
          "A busy tree-lined street from Plaça de Catalunya down toward the waterfront.",
        bestTime: "Late afternoon",
        lat: 41.38139,
        lon: 2.17306,
      },
      {
        id: "casa-batllo",
        name: "Casa Batlló",
        category: "attraction",
        description:
          "A Gaudí townhouse on Passeig de Gràcia with a colorful tiled façade.",
        bestTime: "Late morning",
        lat: 41.39158,
        lon: 2.16492,
      },
      {
        id: "cal-pep",
        name: "Cal Pep",
        category: "restaurant",
        description:
          "A lively counter-seating tapas bar in El Born, famous for its seafood.",
        bestTime: "Lunch",
        lat: 41.39615,
        lon: 2.14892,
      },
      {
        id: "el-xampanyet",
        name: "El Xampanyet",
        category: "restaurant",
        description:
          "A tiled, old-school cava bar near the Picasso Museum serving simple tapas.",
        bestTime: "Evening",
        lat: 41.38451,
        lon: 2.18167,
      },
      {
        id: "els-quatre-gats",
        name: "Els Quatre Gats",
        category: "cafe",
        description:
          "A modernist café once frequented by Picasso, in a building by Puig i Cadafalch.",
        bestTime: "Afternoon",
        lat: 41.38574,
        lon: 2.17364,
      },
      {
        id: "granja-viader",
        name: "Granja M. Viader",
        category: "cafe",
        description:
          "A historic granja off La Rambla, known for thick hot chocolate and Cacaolat.",
        bestTime: "Morning",
        lat: 41.38296,
        lon: 2.171,
      },
    ],
  },
  {
    id: "new-york",
    name: "New York",
    country: "United States",
    image: "/cities/new-york.webp",
    photoCredit: "Luca Bravo",
    places: [
      {
        id: "statue-of-liberty",
        name: "Statue of Liberty",
        category: "attraction",
        description:
          "A harbor monument on Liberty Island, reached by ferry from Manhattan.",
        bestTime: "Morning",
        lat: 40.68921,
        lon: -74.04443,
      },
      {
        id: "central-park",
        name: "Central Park",
        category: "attraction",
        description:
          "A large urban park in Manhattan with lakes, paths, and open lawns.",
        bestTime: "Late afternoon",
        lat: 40.7825,
        lon: -73.96611,
      },
      {
        id: "empire-state-building",
        name: "Empire State Building",
        category: "attraction",
        description:
          "An Art Deco skyscraper with an observation deck over Midtown.",
        bestTime: "Sunset",
        lat: 40.74833,
        lon: -73.98556,
      },
      {
        id: "metropolitan-museum",
        name: "The Metropolitan Museum of Art",
        category: "attraction",
        description:
          "A vast art museum on Fifth Avenue covering thousands of years of work.",
        bestTime: "Early morning",
        lat: 40.77944,
        lon: -73.96333,
      },
      {
        id: "katzs-deli",
        name: "Katz's Delicatessen",
        category: "restaurant",
        description:
          "A Lower East Side institution since 1888, famous for its pastrami on rye.",
        bestTime: "Lunch",
        lat: 40.72234,
        lon: -73.98735,
      },
      {
        id: "joes-pizza",
        name: "Joe's Pizza",
        category: "restaurant",
        description:
          "A classic Greenwich Village slice shop serving New York-style pizza.",
        bestTime: "Evening",
        lat: 40.73055,
        lon: -74.00206,
      },
      {
        id: "caffe-reggio",
        name: "Caffe Reggio",
        category: "cafe",
        description:
          "A Greenwich Village café open since 1927, said to have introduced the cappuccino to America.",
        bestTime: "Afternoon",
        lat: 40.73032,
        lon: -74.00036,
      },
      {
        id: "venieros",
        name: "Veniero's Pastry",
        category: "cafe",
        description:
          "An East Village pastry shop and café dating back to 1894, known for cannoli and cheesecake.",
        bestTime: "Afternoon",
        lat: 40.72947,
        lon: -73.98448,
      },
    ],
  },
  {
    id: "tokyo",
    name: "Tokyo",
    country: "Japan",
    image: "/cities/tokyo.webp",
    photoCredit: "Louie Martinez",
    places: [
      {
        id: "senso-ji",
        name: "Sensō-ji",
        category: "attraction",
        description:
          "Tokyo's oldest temple, approached through the Nakamise shopping street.",
        bestTime: "Early morning",
        lat: 35.71456,
        lon: 139.79664,
      },
      {
        id: "meiji-shrine",
        name: "Meiji Shrine",
        category: "attraction",
        description: "A Shinto shrine set in a forested park near Harajuku.",
        bestTime: "Morning",
        lat: 35.67611,
        lon: 139.69917,
      },
      {
        id: "shibuya-crossing",
        name: "Shibuya Crossing",
        category: "attraction",
        description:
          "A famous scramble intersection surrounded by screens and shopping streets.",
        bestTime: "Evening",
        lat: 35.6595,
        lon: 139.70054,
      },
      {
        id: "tokyo-skytree",
        name: "Tokyo Skytree",
        category: "attraction",
        description:
          "A broadcasting tower with observation decks over the city.",
        bestTime: "Sunset",
        lat: 35.71006,
        lon: 139.81072,
      },
      {
        id: "ichiran-shibuya",
        name: "Ichiran Shibuya",
        category: "restaurant",
        description:
          "A tonkotsu ramen shop where you eat in individual booths.",
        bestTime: "Evening",
        lat: 35.66096,
        lon: 139.6987,
      },
      {
        id: "gonpachi",
        name: "Gonpachi Nishi-Azabu",
        category: "restaurant",
        description:
          "A dramatic izakaya-style restaurant that inspired a scene in Kill Bill.",
        bestTime: "Dinner",
        lat: 35.66016,
        lon: 139.72359,
      },
      {
        id: "blue-bottle-kiyosumi",
        name: "Blue Bottle Coffee Kiyosumi",
        category: "cafe",
        description:
          "Blue Bottle's first café in Japan, set in a converted warehouse in Kiyosumi-Shirakawa.",
        bestTime: "Morning",
      },
      {
        id: "koffee-mameya",
        name: "Koffee Mameya",
        category: "cafe",
        description:
          "A specialty coffee bean shop in Omotesando, known for expert hand-brewed tastings.",
        bestTime: "Afternoon",
        lat: 35.66848,
        lon: 139.7109,
      },
    ],
  },
  {
    id: "istanbul",
    name: "Istanbul",
    country: "Turkey",
    image: "/cities/istanbul.webp",
    photoCredit: "Ibrahim Uzun",
    places: [
      {
        id: "hagia-sophia",
        name: "Hagia Sophia",
        category: "attraction",
        description:
          "A former cathedral and mosque with a vast dome in Sultanahmet.",
        bestTime: "Morning",
        lat: 41.00833,
        lon: 28.98,
      },
      {
        id: "blue-mosque",
        name: "Blue Mosque",
        category: "attraction",
        description:
          "A mosque known for its cascading domes and blue interior tiles.",
        bestTime: "Late morning",
        lat: 41.00539,
        lon: 28.97682,
      },
      {
        id: "grand-bazaar",
        name: "Grand Bazaar",
        category: "attraction",
        description:
          "A historic covered market with thousands of shops and stalls.",
        bestTime: "Afternoon",
        lat: 41.01058,
        lon: 28.96793,
      },
      {
        id: "topkapi-palace",
        name: "Topkapi Palace",
        category: "attraction",
        description:
          "The Ottoman sultans' palace, with courtyards overlooking the Bosphorus.",
        bestTime: "Early morning",
        lat: 41.013,
        lon: 28.984,
      },
      {
        id: "hamdi",
        name: "Hamdi Restaurant",
        category: "restaurant",
        description:
          "A kebab restaurant near the Spice Bazaar with views over the Golden Horn.",
        bestTime: "Dinner",
        lat: 41.01716,
        lon: 28.9699,
      },
      {
        id: "karakoy-lokantasi",
        name: "Karaköy Lokantası",
        category: "restaurant",
        description:
          "A stylish restaurant serving Turkish home-style dishes and meze.",
        bestTime: "Lunch",
        lat: 41.02459,
        lon: 28.98003,
      },
      {
        id: "mandabatmaz",
        name: "Mandabatmaz",
        category: "cafe",
        description:
          "A tiny café off İstiklal Avenue, famous for its thick Turkish coffee.",
        bestTime: "Afternoon",
        lat: 41.03276,
        lon: 28.97617,
      },
      {
        id: "pierre-loti-cafe",
        name: "Pierre Loti Café",
        category: "cafe",
        description:
          "A hilltop café in Eyüp with panoramic views over the Golden Horn.",
        bestTime: "Sunset",
        lat: 41.05371,
        lon: 28.93354,
      },
    ],
  },
  {
    id: "prague",
    name: "Prague",
    country: "Czech Republic",
    image: "/cities/prague.webp",
    photoCredit: "William Zhang",
    places: [
      {
        id: "prague-castle",
        name: "Prague Castle",
        category: "attraction",
        description:
          "A castle complex above the Vltava, including St. Vitus Cathedral.",
        bestTime: "Early morning",
        lat: 50.09,
        lon: 14.4,
      },
      {
        id: "charles-bridge",
        name: "Charles Bridge",
        category: "attraction",
        description:
          "A historic stone bridge lined with statues, linking Old Town and Malá Strana.",
        bestTime: "Sunrise",
        lat: 50.08639,
        lon: 14.41194,
      },
      {
        id: "old-town-square",
        name: "Old Town Square",
        category: "attraction",
        description:
          "The city's main square, known for the Astronomical Clock and baroque churches.",
        bestTime: "Late afternoon",
        lat: 50.0875,
        lon: 14.42139,
      },
      {
        id: "jewish-quarter",
        name: "Josefov",
        category: "attraction",
        description:
          "Prague's historic Jewish quarter, with synagogues and the Old Jewish Cemetery.",
        bestTime: "Morning",
        lat: 50.09028,
        lon: 14.41944,
      },
      {
        id: "lokal-dlouha",
        name: "Lokál Dlouhááá",
        category: "restaurant",
        description:
          "A lively beer hall serving fresh tank Pilsner and classic Czech dishes.",
        bestTime: "Dinner",
        lat: 50.0907,
        lon: 14.42576,
      },
      {
        id: "u-fleku",
        name: "U Fleků",
        category: "restaurant",
        description:
          "A centuries-old brewery and beer hall known for its dark lager.",
        bestTime: "Evening",
        lat: 50.07874,
        lon: 14.41702,
      },
      {
        id: "cafe-louvre",
        name: "Café Louvre",
        category: "cafe",
        description:
          "A grand café from 1902 once visited by Kafka and Einstein.",
        bestTime: "Morning",
        lat: 50.08207,
        lon: 14.41873,
      },
      {
        id: "cafe-savoy",
        name: "Café Savoy",
        category: "cafe",
        description:
          "An elegant Viennese-style café in Malá Strana with a stunning painted ceiling.",
        bestTime: "Morning",
        lat: 50.08093,
        lon: 14.40722,
      },
    ],
  },
  {
    id: "athens",
    name: "Athens",
    country: "Greece",
    image: "/cities/athens.webp",
    photoCredit: "Constantinos Kollias",
    places: [
      {
        id: "acropolis",
        name: "Acropolis",
        category: "attraction",
        description:
          "The hilltop citadel that includes the Parthenon and other ancient temples.",
        bestTime: "Early morning",
        lat: 37.97167,
        lon: 23.72611,
      },
      {
        id: "acropolis-museum",
        name: "Acropolis Museum",
        category: "attraction",
        description:
          "A museum at the foot of the Acropolis displaying finds from the site.",
        bestTime: "Late morning",
        lat: 37.96842,
        lon: 23.72847,
      },
      {
        id: "plaka",
        name: "Plaka",
        category: "attraction",
        description:
          "A historic neighborhood of narrow streets below the Acropolis.",
        bestTime: "Evening",
        lat: 37.97222,
        lon: 23.73056,
      },
      {
        id: "ancient-agora",
        name: "Ancient Agora",
        category: "attraction",
        description:
          "The civic heart of ancient Athens, with the Temple of Hephaestus.",
        bestTime: "Afternoon",
        lat: 37.975,
        lon: 23.7225,
      },
      {
        id: "o-thanasis",
        name: "O Thanasis",
        category: "restaurant",
        description:
          "A Monastiraki favourite for kebab and souvlaki since the 1960s.",
        bestTime: "Lunch",
        lat: 37.97617,
        lon: 23.72704,
      },
      {
        id: "karamanlidika",
        name: "Karamanlidika tou Fani",
        category: "restaurant",
        description:
          "A deli and taverna serving cured meats, cheeses and meze.",
        bestTime: "Dinner",
        lat: 37.97707,
        lon: 23.72279,
      },
      {
        id: "taf-coffee",
        name: "TAF Coffee",
        category: "cafe",
        description:
          "A pioneering specialty coffee roaster in the centre of Athens.",
        bestTime: "Morning",
      },
      {
        id: "little-kook",
        name: "Little Kook",
        category: "cafe",
        description:
          "A whimsical dessert café in Psyrri with elaborate seasonal decorations.",
        bestTime: "Afternoon",
        lat: 37.97774,
        lon: 23.72437,
      },
    ],
  },
];

export default cities;
