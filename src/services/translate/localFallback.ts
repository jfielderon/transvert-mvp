const PHRASE_TRANSLATIONS: Array<[RegExp, string]> = [
  [/\bmen[uú]\s+del\s+d[ií]a\b/gi, 'daily menu'],
  [/\bpaella\s+valenciana\b/gi, 'Valencian paella'],
  [/\bensalada\s+mixta\b/gi, 'mixed salad'],
  [/\bgazpacho\b/gi, 'gazpacho'],
  [/\btarta\s+de\s+queso\b/gi, 'cheesecake'],
  [/\bservicio\s+incluido\b/gi, 'service included'],
  [/\bpropina\b/gi, 'tip'],
  [/\bcubierto\b/gi, 'cover charge'],
  [/\bpulpo\s+a\s+la\s+gallega\b/gi, 'Galician-style octopus'],
  [/\bpollo\s+a\s+la\s+parrilla\b/gi, 'grilled chicken'],
  [/\bpaella\s+de\s+mariscos\b/gi, 'seafood paella'],
  [/\bpaella\s+marinera\b/gi, 'seafood paella'],
  [/\barroz\s+negro\b/gi, 'black rice'],
  [/\bfilete\s+de\s+lubina\b/gi, 'sea bass fillet'],
  [/\btrucha\s+a\s+la\s+menta\b/gi, 'trout with mint'],
  [/\bcerdo\s+al\s+azafr[aá]n\b/gi, 'pork with saffron'],
  [/\bjam[oó]n\b/gi, 'ham'],
  [/\bqueso\b/gi, 'cheese'],
  [/\bpan\b/gi, 'bread'],
  [/\bagua\b/gi, 'water'],
  [/\bvino\b/gi, 'wine'],
  [/\bcaf[eé]\b/gi, 'coffee'],
  [/\bpostre\b/gi, 'dessert'],
  [/\bentrada\b/gi, 'starter'],
  [/\bde\s+primero\b/gi, 'first course'],
  [/\bde\s+segundo\b/gi, 'main course'],
  [/\bprecio\b/gi, 'price'],
  [/\btotal\b/gi, 'total'],
];

export function localFallbackTranslate(text: string) {
  if (!text.trim()) return '';

  return PHRASE_TRANSLATIONS.reduce(
    (output, [pattern, replacement]) =>
      output.replace(pattern, (matched) => matchCase(matched, replacement)),
    text
  );
}

function matchCase(source: string, translated: string) {
  if (source === source.toUpperCase()) return translated.toUpperCase();
  if (source[0] === source[0]?.toUpperCase()) return translated[0].toUpperCase() + translated.slice(1);
  return translated;
}
