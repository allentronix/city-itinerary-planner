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
      },
      {
        id: "buda-castle",
        name: "Buda Castle",
        category: "attraction",
        description: "A historic castle complex with views across Budapest.",
        bestTime: "Late afternoon",
      },
      {
        id: "fishermans-bastion",
        name: "Fisherman's Bastion",
        category: "attraction",
        description:
          "A neo-Gothic terrace with panoramic views over the Danube and Pest.",
        bestTime: "Sunset",
      },
      {
        id: "szechenyi-baths",
        name: "Széchenyi Thermal Baths",
        category: "attraction",
        description:
          "A large spa complex with outdoor thermal pools in City Park.",
        bestTime: "Morning",
      },
      {
        id: "gundel",
        name: "Gundel",
        category: "restaurant",
        description:
          "A historic fine-dining restaurant next to City Park, known for classic Hungarian dishes and the Gundel pancake.",
        bestTime: "Dinner",
      },
      {
        id: "borkonyha",
        name: "Borkonyha Winekitchen",
        category: "restaurant",
        description:
          "A Michelin-starred wine bistro serving modern Hungarian food with a long list of local wines.",
        bestTime: "Dinner",
      },
      {
        id: "new-york-cafe",
        name: "New York Café",
        category: "cafe",
        description:
          "An opulent 19th-century grand café, often called one of the most beautiful cafés in the world.",
        bestTime: "Morning",
      },
      {
        id: "gerbeaud",
        name: "Gerbeaud",
        category: "cafe",
        description:
          "A classic coffee house and confectionery on Vörösmarty Square, famous for its cakes.",
        bestTime: "Afternoon",
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
      },
      {
        id: "trevi-fountain",
        name: "Trevi Fountain",
        category: "attraction",
        description:
          "A landmark fountain known for its beautiful stone detail and coins.",
        bestTime: "Late evening",
      },
      {
        id: "pantheon",
        name: "Pantheon",
        category: "attraction",
        description:
          "A remarkably preserved Roman temple with a vast concrete dome.",
        bestTime: "Late morning",
      },
      {
        id: "vatican-museums",
        name: "Vatican Museums",
        category: "attraction",
        description: "A vast museum complex that includes the Sistine Chapel.",
        bestTime: "Early morning",
      },
      {
        id: "roscioli",
        name: "Roscioli Salumeria con Cucina",
        category: "restaurant",
        description:
          "A deli and restaurant near Campo de' Fiori, known for carbonara, cured meats and cheeses.",
        bestTime: "Dinner",
      },
      {
        id: "da-enzo",
        name: "Da Enzo al 29",
        category: "restaurant",
        description:
          "A small, popular trattoria in Trastevere serving traditional Roman dishes.",
        bestTime: "Lunch",
      },
      {
        id: "sant-eustachio",
        name: "Sant'Eustachio Il Caffè",
        category: "cafe",
        description:
          "A historic coffee bar near the Pantheon, famous for its creamy espresso.",
        bestTime: "Morning",
      },
      {
        id: "tazza-doro",
        name: "Tazza d'Oro",
        category: "cafe",
        description:
          "A coffee roaster steps from the Pantheon, known for its granita di caffè.",
        bestTime: "Afternoon",
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
      },
      {
        id: "louvre",
        name: "Louvre Museum",
        category: "attraction",
        description:
          "A former palace that now holds one of the world's largest art collections.",
        bestTime: "Early morning",
      },
      {
        id: "notre-dame",
        name: "Notre-Dame Cathedral",
        category: "attraction",
        description:
          "A Gothic cathedral on the Île de la Cité, known for its façade and rose windows.",
        bestTime: "Morning",
      },
      {
        id: "sacre-coeur",
        name: "Sacré-Cœur",
        category: "attraction",
        description:
          "A white basilica on Montmartre hill with wide views over the city.",
        bestTime: "Late afternoon",
      },
      {
        id: "bouillon-chartier",
        name: "Bouillon Chartier",
        category: "restaurant",
        description:
          "A bustling Belle Époque dining hall serving affordable French classics since 1896.",
        bestTime: "Dinner",
      },
      {
        id: "relais-entrecote",
        name: "Le Relais de l'Entrecôte",
        category: "restaurant",
        description:
          "A no-menu steak-frites restaurant famous for its secret green sauce.",
        bestTime: "Lunch",
      },
      {
        id: "cafe-de-flore",
        name: "Café de Flore",
        category: "cafe",
        description:
          "A legendary Saint-Germain café once frequented by writers and artists.",
        bestTime: "Morning",
      },
      {
        id: "les-deux-magots",
        name: "Les Deux Magots",
        category: "cafe",
        description:
          "A historic café on Saint-Germain-des-Prés with a classic terrace for people-watching.",
        bestTime: "Afternoon",
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
      },
      {
        id: "british-museum",
        name: "British Museum",
        category: "attraction",
        description:
          "A major museum of world history and culture, including the Rosetta Stone.",
        bestTime: "Early morning",
      },
      {
        id: "big-ben",
        name: "Big Ben and the Houses of Parliament",
        category: "attraction",
        description:
          "London's clock tower and the riverside home of the UK Parliament.",
        bestTime: "Late afternoon",
      },
      {
        id: "westminster-abbey",
        name: "Westminster Abbey",
        category: "attraction",
        description:
          "A Gothic church used for royal ceremonies and historic burials.",
        bestTime: "Morning",
      },
      {
        id: "dishoom",
        name: "Dishoom Covent Garden",
        category: "restaurant",
        description:
          "A Bombay-style café restaurant known for its black daal and bacon naan rolls.",
        bestTime: "Dinner",
      },
      {
        id: "rules",
        name: "Rules",
        category: "restaurant",
        description:
          "London's oldest restaurant, serving traditional British game, pies and puddings since 1798.",
        bestTime: "Dinner",
      },
      {
        id: "monmouth-coffee",
        name: "Monmouth Coffee",
        category: "cafe",
        description:
          "A much-loved coffee roaster by Borough Market, known for its filter coffee.",
        bestTime: "Morning",
      },
      {
        id: "bar-italia",
        name: "Bar Italia",
        category: "cafe",
        description:
          "An iconic Soho espresso bar that has been open since 1949.",
        bestTime: "Afternoon",
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
      },
      {
        id: "park-guell",
        name: "Park Güell",
        category: "attraction",
        description:
          "A hillside park with mosaic benches, pavilions, and city views.",
        bestTime: "Early morning",
      },
      {
        id: "la-rambla",
        name: "La Rambla",
        category: "attraction",
        description:
          "A busy tree-lined street from Plaça de Catalunya down toward the waterfront.",
        bestTime: "Late afternoon",
      },
      {
        id: "casa-batllo",
        name: "Casa Batlló",
        category: "attraction",
        description:
          "A Gaudí townhouse on Passeig de Gràcia with a colorful tiled façade.",
        bestTime: "Late morning",
      },
      {
        id: "cal-pep",
        name: "Cal Pep",
        category: "restaurant",
        description:
          "A lively counter-seating tapas bar in El Born, famous for its seafood.",
        bestTime: "Lunch",
      },
      {
        id: "el-xampanyet",
        name: "El Xampanyet",
        category: "restaurant",
        description:
          "A tiled, old-school cava bar near the Picasso Museum serving simple tapas.",
        bestTime: "Evening",
      },
      {
        id: "els-quatre-gats",
        name: "Els Quatre Gats",
        category: "cafe",
        description:
          "A modernist café once frequented by Picasso, in a building by Puig i Cadafalch.",
        bestTime: "Afternoon",
      },
      {
        id: "granja-viader",
        name: "Granja M. Viader",
        category: "cafe",
        description:
          "A historic granja off La Rambla, known for thick hot chocolate and Cacaolat.",
        bestTime: "Morning",
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
      },
      {
        id: "central-park",
        name: "Central Park",
        category: "attraction",
        description:
          "A large urban park in Manhattan with lakes, paths, and open lawns.",
        bestTime: "Late afternoon",
      },
      {
        id: "empire-state-building",
        name: "Empire State Building",
        category: "attraction",
        description:
          "An Art Deco skyscraper with an observation deck over Midtown.",
        bestTime: "Sunset",
      },
      {
        id: "metropolitan-museum",
        name: "The Metropolitan Museum of Art",
        category: "attraction",
        description:
          "A vast art museum on Fifth Avenue covering thousands of years of work.",
        bestTime: "Early morning",
      },
      {
        id: "katzs-deli",
        name: "Katz's Delicatessen",
        category: "restaurant",
        description:
          "A Lower East Side institution since 1888, famous for its pastrami on rye.",
        bestTime: "Lunch",
      },
      {
        id: "joes-pizza",
        name: "Joe's Pizza",
        category: "restaurant",
        description:
          "A classic Greenwich Village slice shop serving New York-style pizza.",
        bestTime: "Evening",
      },
      {
        id: "caffe-reggio",
        name: "Caffe Reggio",
        category: "cafe",
        description:
          "A Greenwich Village café open since 1927, said to have introduced the cappuccino to America.",
        bestTime: "Afternoon",
      },
      {
        id: "venieros",
        name: "Veniero's Pastry",
        category: "cafe",
        description:
          "An East Village pastry shop and café dating back to 1894, known for cannoli and cheesecake.",
        bestTime: "Afternoon",
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
      },
      {
        id: "meiji-shrine",
        name: "Meiji Shrine",
        category: "attraction",
        description: "A Shinto shrine set in a forested park near Harajuku.",
        bestTime: "Morning",
      },
      {
        id: "shibuya-crossing",
        name: "Shibuya Crossing",
        category: "attraction",
        description:
          "A famous scramble intersection surrounded by screens and shopping streets.",
        bestTime: "Evening",
      },
      {
        id: "tokyo-skytree",
        name: "Tokyo Skytree",
        category: "attraction",
        description:
          "A broadcasting tower with observation decks over the city.",
        bestTime: "Sunset",
      },
      {
        id: "ichiran-shibuya",
        name: "Ichiran Shibuya",
        category: "restaurant",
        description:
          "A tonkotsu ramen shop where you eat in individual booths.",
        bestTime: "Evening",
      },
      {
        id: "gonpachi",
        name: "Gonpachi Nishi-Azabu",
        category: "restaurant",
        description:
          "A dramatic izakaya-style restaurant that inspired a scene in Kill Bill.",
        bestTime: "Dinner",
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
      },
      {
        id: "blue-mosque",
        name: "Blue Mosque",
        category: "attraction",
        description:
          "A mosque known for its cascading domes and blue interior tiles.",
        bestTime: "Late morning",
      },
      {
        id: "grand-bazaar",
        name: "Grand Bazaar",
        category: "attraction",
        description:
          "A historic covered market with thousands of shops and stalls.",
        bestTime: "Afternoon",
      },
      {
        id: "topkapi-palace",
        name: "Topkapi Palace",
        category: "attraction",
        description:
          "The Ottoman sultans' palace, with courtyards overlooking the Bosphorus.",
        bestTime: "Early morning",
      },
      {
        id: "hamdi",
        name: "Hamdi Restaurant",
        category: "restaurant",
        description:
          "A kebab restaurant near the Spice Bazaar with views over the Golden Horn.",
        bestTime: "Dinner",
      },
      {
        id: "karakoy-lokantasi",
        name: "Karaköy Lokantası",
        category: "restaurant",
        description:
          "A stylish restaurant serving Turkish home-style dishes and meze.",
        bestTime: "Lunch",
      },
      {
        id: "mandabatmaz",
        name: "Mandabatmaz",
        category: "cafe",
        description:
          "A tiny café off İstiklal Avenue, famous for its thick Turkish coffee.",
        bestTime: "Afternoon",
      },
      {
        id: "pierre-loti-cafe",
        name: "Pierre Loti Café",
        category: "cafe",
        description:
          "A hilltop café in Eyüp with panoramic views over the Golden Horn.",
        bestTime: "Sunset",
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
      },
      {
        id: "charles-bridge",
        name: "Charles Bridge",
        category: "attraction",
        description:
          "A historic stone bridge lined with statues, linking Old Town and Malá Strana.",
        bestTime: "Sunrise",
      },
      {
        id: "old-town-square",
        name: "Old Town Square",
        category: "attraction",
        description:
          "The city's main square, known for the Astronomical Clock and baroque churches.",
        bestTime: "Late afternoon",
      },
      {
        id: "jewish-quarter",
        name: "Josefov",
        category: "attraction",
        description:
          "Prague's historic Jewish quarter, with synagogues and the Old Jewish Cemetery.",
        bestTime: "Morning",
      },
      {
        id: "lokal-dlouha",
        name: "Lokál Dlouhááá",
        category: "restaurant",
        description:
          "A lively beer hall serving fresh tank Pilsner and classic Czech dishes.",
        bestTime: "Dinner",
      },
      {
        id: "u-fleku",
        name: "U Fleků",
        category: "restaurant",
        description:
          "A centuries-old brewery and beer hall known for its dark lager.",
        bestTime: "Evening",
      },
      {
        id: "cafe-louvre",
        name: "Café Louvre",
        category: "cafe",
        description:
          "A grand café from 1902 once visited by Kafka and Einstein.",
        bestTime: "Morning",
      },
      {
        id: "cafe-savoy",
        name: "Café Savoy",
        category: "cafe",
        description:
          "An elegant Viennese-style café in Malá Strana with a stunning painted ceiling.",
        bestTime: "Morning",
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
      },
      {
        id: "acropolis-museum",
        name: "Acropolis Museum",
        category: "attraction",
        description:
          "A museum at the foot of the Acropolis displaying finds from the site.",
        bestTime: "Late morning",
      },
      {
        id: "plaka",
        name: "Plaka",
        category: "attraction",
        description:
          "A historic neighborhood of narrow streets below the Acropolis.",
        bestTime: "Evening",
      },
      {
        id: "ancient-agora",
        name: "Ancient Agora",
        category: "attraction",
        description:
          "The civic heart of ancient Athens, with the Temple of Hephaestus.",
        bestTime: "Afternoon",
      },
      {
        id: "o-thanasis",
        name: "O Thanasis",
        category: "restaurant",
        description:
          "A Monastiraki favourite for kebab and souvlaki since the 1960s.",
        bestTime: "Lunch",
      },
      {
        id: "karamanlidika",
        name: "Karamanlidika tou Fani",
        category: "restaurant",
        description:
          "A deli and taverna serving cured meats, cheeses and meze.",
        bestTime: "Dinner",
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
      },
    ],
  },
];

export default cities;
