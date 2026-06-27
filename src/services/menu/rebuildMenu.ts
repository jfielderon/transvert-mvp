import { formatCurrency, formatGbp } from '@/services/fx';
import type { DetectedPrice } from '@/types/scan';

export type RebuiltMenuItem = {
  id: string;
  originalName: string;
  englishName: string;
  description?: string;
  originalPrice: string;
  convertedPrice: string;
  icons: string[];
};

export type RebuiltMenuSection = {
  title: string;
  items: RebuiltMenuItem[];
};

export type RebuiltMenu = {
  title: string;
  subtitle: string;
  sections: RebuiltMenuSection[];
  itemCount: number;
  note: string;
};

const SECTION_WORDS = /(appetizer|starter|tapas|main|dessert|drink|bebida|postre|caliente|fria|fría|cold|hot|wine|beer|coffee|menu)/i;
const DESCRIPTION_SKIP = /(dinner menu|fayda|hot appetizers|cold appetizers|tapas calientes|tapas frias|tapas frías|gf|vg)$/i;

function clean(value?: string) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function normalise(value: string) {
  return clean(value).toLowerCase().replace(/[^a-z0-9à-ÿ]+/g, ' ').trim();
}

function titleCase(value: string) {
  return clean(value)
    .toLowerCase()
    .split(' ')
    .map((part) => part ? part[0].toUpperCase() + part.slice(1) : part)
    .join(' ')
    .replace(/\bDe\b/g, 'de')
    .replace(/\bAl\b/g, 'al')
    .replace(/\bLa\b/g, 'la');
}

function findLineIndex(lines: string[], item: DetectedPrice) {
  const itemName = normalise(item.itemText || item.context || '');
  const context = normalise(item.context || '');
  return lines.findIndex((line) => {
    const lineNorm = normalise(line);
    return Boolean(itemName && (lineNorm.includes(itemName) || itemName.includes(lineNorm))) || Boolean(context && lineNorm === context);
  });
}

function descriptionFor(lines: string[], item: DetectedPrice) {
  const index = findLineIndex(lines, item);
  if (index < 0) return undefined;
  const descriptionLines: string[] = [];
  for (let next = index + 1; next < Math.min(lines.length, index + 4); next += 1) {
    const line = clean(lines[next]);
    if (!line || DESCRIPTION_SKIP.test(line)) continue;
    if (/\d{1,3}(?:[.,]\d{2})?\s*(?:GF|VG|V)?$/i.test(line)) break;
    if (SECTION_WORDS.test(line) && line.length < 28) break;
    descriptionLines.push(line);
    if (/[.!?]$/.test(line)) break;
  }
  return descriptionLines.join(' ').trim() || undefined;
}

function foodIcons(text: string) {
  const lower = text.toLowerCase();
  const icons: string[] = [];
  if (/shrimp|prawn|camar|scallop|clam|mussel|octopus|pulpo|calamar|seafood|marisco/.test(lower)) icons.push('🦐');
  if (/chorizo|jamon|jamón|bacon|pork|cerdo/.test(lower)) icons.push('🐖');
  if (/cheese|cream|milk|queso|manchego|gouda/.test(lower)) icons.push('🥛');
  if (/bread|croquet|empanad|flour|pasta|pastry/.test(lower)) icons.push('🌾');
  if (/spicy|hot sauce|bravas|pepper|chilli|chili/.test(lower)) icons.push('🔥');
  if (/avocado|potato|salad|vegetable|onion|beans/.test(lower)) icons.push('🌱');
  return [...new Set(icons)].slice(0, 4);
}

function sectionTitle(section?: string) {
  const value = clean(section);
  if (!value) return 'Menu';
  if (/hot appetizer|tapas caliente/i.test(value)) return 'Hot Appetizers';
  if (/cold appetizer|tapas fri/i.test(value)) return 'Cold Appetizers';
  if (/dessert|postre/i.test(value)) return 'Desserts';
  if (/drink|bebida|beer|cerveza|agua|water|vino/i.test(value)) return 'Drinks';
  return titleCase(value);
}

export function buildRebuiltMenu(originalText: string, prices: DetectedPrice[]): RebuiltMenu {
  const lines = originalText.split('\n').map(clean).filter(Boolean);
  const firstTitle = lines.find((line) => /menu/i.test(line)) ?? 'Translated Menu';
  const sections = new Map<string, RebuiltMenuItem[]>();

  prices
    .filter((price) => price.role !== 'fee')
    .forEach((price) => {
      const section = sectionTitle(price.section);
      const originalName = clean(price.itemText || price.context || 'Menu item');
      const englishName = clean(price.translatedItemText || price.itemText || price.context || 'Menu item');
      const description = descriptionFor(lines, price);
      const allText = `${originalName} ${englishName} ${description ?? ''}`;
      const item: RebuiltMenuItem = {
        id: price.id,
        originalName,
        englishName,
        description,
        originalPrice: formatCurrency(price.amount, price.currency),
        convertedPrice: formatGbp(price.convertedGbp ?? 0),
        icons: foodIcons(allText),
      };
      const existing = sections.get(section) ?? [];
      existing.push(item);
      sections.set(section, existing);
    });

  return {
    title: titleCase(firstTitle.replace(/dinner\s*/i, '')) || 'Translated Menu',
    subtitle: 'Rebuilt in English with GBP estimates',
    sections: Array.from(sections.entries()).map(([title, items]) => ({ title, items })),
    itemCount: prices.length,
    note: 'AI rebuilt menu from OCR. Confirm allergies and final prices with the restaurant.',
  };
}
