// Temporary launch mode: keep advanced search available in code for later.
export const COUNTRY_ONLY_SEARCH = true;

export function filterPropertiesByCountry(properties, country = 'Tous') {
  return properties.filter(property => country === 'Tous' || property.country === country);
}
