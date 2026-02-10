export const destinations = [
  {
    id: "1",
    name: "Punta del Este",
    type: "Bus",
    image: "/punta-del-este.jpg",
    price: "$U 650",
  },
  {
    id: "2",
    name: "Colonia del Sacramento",
    type: "Ferry",
    image: "/colonia.jpg",
    price: "$U 1200",
  },
  {
    id: "3",
    name: "Cabo Polonio",
    type: "Bus",
    image: "/cabo-polonio.jpg",
    price: "$U 850",
  },
  {
    id: "4",
    name: "Piriápolis",
    type: "Bus",
    image: "/piriapolis.jpg",
    price: "$U 480",
  },
];

export const popularRoutes = [
  { from: "Montevideo", to: "Punta del Este", duration: "2h 00m", type: "bus" },
  { from: "Buenos Aires", to: "Colonia", duration: "1h 15m", type: "ferry" },
  { from: "Montevideo", to: "Salto", duration: "6h 00m", type: "bus" },
  { from: "Colonia", to: "Montevideo", duration: "2h 30m", type: "bus" },
];

export const mockLocations = [
  { city: "Montevideo", region: "Montevideo, Uruguay" },
  { city: "Punta del Este", region: "Maldonado, Uruguay" },
  { city: "Colonia del Sacramento", region: "Colonia, Uruguay" },
  { city: "Piriápolis", region: "Maldonado, Uruguay" },
  { city: "Salto", region: "Salto, Uruguay" },
  { city: "Paysandú", region: "Paysandú, Uruguay" },
  { city: "Rivera", region: "Rivera, Uruguay" },
  { city: "Rocha", region: "Rocha, Uruguay" },
  { city: "Cabo Polonio", region: "Rocha, Uruguay" },
  { city: "Buenos Aires", region: "Argentina" }, // Common connection
];
