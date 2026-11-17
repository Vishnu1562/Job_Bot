export const INDIA_LOCATION_KEYWORDS = [
  'india',
  // Kochi / Kerala / Technopark
  'kochi',
  'cochin',
  'infopark',
  'kerala',
  'trivandrum',
  'thiruvananthapuram',
  'technopark',
  'calicut',
  'kozhikode',
  // Bengaluru / Karnataka
  'bangalore',
  'bengaluru',
  'karnataka',
  'whitefield',
  'electronic city',
  'manyata',
  'bellandur',
  'mysore',
  'mysuru',
  // Hyderabad / Telangana / AP
  'hyderabad',
  'telangana',
  'hitec city',
  'cyberabad',
  'gachibowli',
  'madhapur',
  'kondapur',
  'visakhapatnam',
  'vizag',
  // Pune / Mumbai / Maharashtra
  'pune',
  'maharashtra',
  'hinjawadi',
  'magarpatta',
  'kharadi',
  'mumbai',
  'navi mumbai',
  'airoli',
  'thane',
  // Chennai / Coimbatore / Tamil Nadu
  'chennai',
  'tamil nadu',
  'omr',
  'tidel',
  'tidel park',
  'guindy',
  'siruseri',
  'coimbatore',
  // Delhi NCR
  'delhi',
  'ncr',
  'noida',
  'greater noida',
  'gurgaon',
  'gurugram',
  'faridabad',
  'cyber city',
  // East & West
  'kolkata',
  'west bengal',
  'salt lake',
  'sector v',
  'new town',
  'ahmedabad',
  'gujarat',
  'gift city',
  // Remote & Global
  'remote - in',
  'remote in',
  'remote - india',
  'remote (india)',
  'india (remote)',
  'worldwide',
  'anywhere',
  'global'
];

export const EXCLUDED_REGIONS = [
  'us only',
  'usa only',
  'united states only',
  'us / canada only',
  'uk only',
  'united kingdom only',
  'europe only',
  'eu only',
  'latam only',
  'canada only'
];

export function isIndiaLocation(locationText: string): boolean {
  if (!locationText) return false;
  const loc = locationText.toLowerCase();

  // Check if explicitly restricted to another country/region
  for (const excluded of EXCLUDED_REGIONS) {
    if (loc.includes(excluded)) {
      return false;
    }
  }

  // Check if matches India or Worldwide/Global
  return INDIA_LOCATION_KEYWORDS.some((kw) => loc.includes(kw));
}
