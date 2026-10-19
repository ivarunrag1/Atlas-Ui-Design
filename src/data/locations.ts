/* Mock location master data for the rate search (would come from a ports / address API). */

export interface Port {
  code: string; // UN/LOCODE
  name: string;
  country: string;
}

export interface DoorLocation {
  id: string;
  name: string;
  city: string;
  pincode: string;
  country: string;
}

export const ports: Port[] = [
  { code: 'INNSA', name: 'Nhava Sheva', country: 'India' },
  { code: 'INMUN', name: 'Mundra', country: 'India' },
  { code: 'INPAV', name: 'Pipavav', country: 'India' },
  { code: 'INHZA', name: 'Hazira', country: 'India' },
  { code: 'INTUT', name: 'Tuticorin', country: 'India' },
  { code: 'INMAA', name: 'Chennai', country: 'India' },
  { code: 'INCCU', name: 'Kolkata', country: 'India' },
  { code: 'INVTZ', name: 'Visakhapatnam', country: 'India' },
  { code: 'DEHAM', name: 'Hamburg', country: 'Germany' },
  { code: 'DEBRV', name: 'Bremerhaven', country: 'Germany' },
  { code: 'DEWVN', name: 'Wilhelmshaven', country: 'Germany' },
  { code: 'NLRTM', name: 'Rotterdam', country: 'Netherlands' },
  { code: 'BEANR', name: 'Antwerp', country: 'Belgium' },
  { code: 'SGSIN', name: 'Singapore', country: 'Singapore' },
  { code: 'AEJEA', name: 'Jebel Ali', country: 'UAE' },
  { code: 'CNSHA', name: 'Shanghai', country: 'China' },
  { code: 'USNYC', name: 'New York', country: 'United States' },
];

export const doorLocations: DoorLocation[] = [
  { id: 'd1', name: 'Bhiwandi Logistics Park', city: 'Bhiwandi', pincode: '421302', country: 'India' },
  { id: 'd2', name: 'Andheri East', city: 'Mumbai', pincode: '400069', country: 'India' },
  { id: 'd3', name: 'Chakan MIDC', city: 'Pune', pincode: '410501', country: 'India' },
  { id: 'd4', name: 'Sanand GIDC', city: 'Ahmedabad', pincode: '382110', country: 'India' },
  { id: 'd5', name: 'Sriperumbudur', city: 'Chennai', pincode: '602105', country: 'India' },
  { id: 'd6', name: 'Altona Industrial', city: 'Hamburg', pincode: '22765', country: 'Germany' },
  { id: 'd7', name: 'GVZ Bremen', city: 'Bremen', pincode: '28197', country: 'Germany' },
  { id: 'd8', name: 'Logport Duisburg', city: 'Duisburg', pincode: '47229', country: 'Germany' },
  { id: 'd9', name: 'Freimann', city: 'Munich', pincode: '80939', country: 'Germany' },
  { id: 'd10', name: 'Waalhaven', city: 'Rotterdam', pincode: '3089', country: 'Netherlands' },
];

/** Alternative ports within reasonable trucking/rail distance of each port. */
const nearbyCodes: Record<string, string[]> = {
  INNSA: ['INMUN', 'INPAV', 'INHZA'],
  INMUN: ['INPAV', 'INNSA', 'INHZA'],
  INPAV: ['INMUN', 'INHZA', 'INNSA'],
  INHZA: ['INNSA', 'INPAV', 'INMUN'],
  INMAA: ['INTUT', 'INVTZ'],
  INTUT: ['INMAA'],
  INCCU: ['INVTZ'],
  INVTZ: ['INCCU', 'INMAA'],
  DEHAM: ['DEBRV', 'DEWVN', 'NLRTM', 'BEANR'],
  DEBRV: ['DEHAM', 'DEWVN', 'NLRTM'],
  DEWVN: ['DEBRV', 'DEHAM'],
  NLRTM: ['BEANR', 'DEHAM', 'DEBRV'],
  BEANR: ['NLRTM', 'DEHAM'],
};

export const nearbyPorts = (code: string): Port[] =>
  (nearbyCodes[code] ?? []).map((c) => ports.find((p) => p.code === c)).filter((p): p is Port => !!p);

export const portByCode = (code: string) => ports.find((p) => p.code === code) ?? null;
