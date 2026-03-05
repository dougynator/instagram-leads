import { FilterCriteria } from './types';

export const COUNTRY_OPTIONS = [
  { value: 'belgium', label: 'Belgium' },
  { value: 'netherlands', label: 'Netherlands' },
  { value: 'france', label: 'France' },
  { value: 'germany', label: 'Germany' },
  { value: 'luxembourg', label: 'Luxembourg' },
] as const;

export const BELGIUM_PROVINCE_OPTIONS = [
  'Antwerp',
  'Brussels',
  'East Flanders',
  'Flemish Brabant',
  'Hainaut',
  'Liege',
  'Limburg',
  'Luxembourg (BE)',
  'Namur',
  'Walloon Brabant',
  'West Flanders',
] as const;

const BELGIUM_BASE_KEYWORDS = [
  'belgium',
  'belgie',
  'belgië',
  'belgique',
  'belgien',
];

const COUNTRY_KEYWORDS: Record<string, string[]> = {
  belgium: BELGIUM_BASE_KEYWORDS,
  netherlands: ['netherlands', 'nederland', 'holland'],
  france: ['france', 'français', 'francaise', 'francais'],
  germany: ['germany', 'deutschland'],
  luxembourg: ['luxembourg', 'letzebuerg'],
};

const BELGIUM_PROVINCE_KEYWORDS: Record<string, string[]> = {
  Antwerp: ['antwerp', 'antwerpen', 'anvers'],
  Brussels: ['brussels', 'bruxelles', 'brussel'],
  'East Flanders': ['east flanders', 'oost-vlaanderen', 'oost vlaanderen', 'flanders'],
  'Flemish Brabant': ['flemish brabant', 'vlaams-brabant', 'vlaams brabant'],
  Hainaut: ['hainaut', 'henegouwen'],
  Liege: ['liege', 'liège', 'luik'],
  Limburg: ['limburg'],
  'Luxembourg (BE)': ['luxembourg belgium', 'provincie luxemburg', 'province de luxembourg'],
  Namur: ['namur', 'namen'],
  'Walloon Brabant': ['walloon brabant', 'brabant wallon', 'waals-brabant', 'waals brabant'],
  'West Flanders': ['west flanders', 'west-vlaanderen', 'west vlaanderen'],
};

export function getLocationKeywordsFromFilters(filters: FilterCriteria): string[] {
  const selectedCountry = filters.location_country?.trim().toLowerCase();
  if (!selectedCountry) return [];

  const countryKeywords = COUNTRY_KEYWORDS[selectedCountry] || [];

  if (selectedCountry !== 'belgium') {
    return [...countryKeywords];
  }

  const selectedProvinces = filters.location_belgium_provinces || [];
  const provinceKeywords = selectedProvinces.flatMap(
    (province) => BELGIUM_PROVINCE_KEYWORDS[province] || []
  );

  return [...countryKeywords, ...provinceKeywords];
}
