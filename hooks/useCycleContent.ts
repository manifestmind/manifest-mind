import contentFr from '../assets/content/content_fr.json';
import contentEn from '../assets/content/content_en.json';
import contentEs from '../assets/content/content_es.json';

interface CycleDay {
  theme: string;
  couleur_principale: string;
  couleur_fond: string;
  jour_semaine: string;
  phase: string;
  affirmation: string;
  action_facile: string;
  action_difficile: string;
  visualisation?: {
    p1?: string;
    p2?: string;
    p3?: string;
    p4?: string;
    finale?: string;
  };
}

type ContentData = Record<string, CycleDay>;

function getContent(lang?: string): ContentData {
  if (lang === 'en') return contentEn as ContentData;
  if (lang === 'es') return contentEs as ContentData;
  return contentFr as ContentData;
}

export function getCycleColors(cycleNumber: number, lang?: string): { orb1: string; orb2: string } {
  const content = getContent(lang);
  const key = 'jour_' + cycleNumber;
  const data = content[key];
  if (!data) return { orb1: '#C4A8D4', orb2: '#B8D4B0' };
  return {
    orb1: data.couleur_principale || '#C4A8D4',
    orb2: data.couleur_fond       || '#B8D4B0',
  };
}

export function getCycleContent(cycleNumber: number, lang?: string) {
  const content = getContent(lang);
  const key = 'jour_' + cycleNumber;
  const data = content[key];
  if (!data) return null;
  return {
    theme: data.theme,
    couleurPrincipale: data.couleur_principale,
    jourSemaine: data.jour_semaine,
    phase: data.phase,
    affirmation: data.affirmation,
    actionFacile: data.action_facile,
    actionDifficile: data.action_difficile,
    visualisation: {
      p1: data.visualisation?.p1 || '',
      p2: data.visualisation?.p2 || '',
      p3: data.visualisation?.p3 || '',
      p4: data.visualisation?.p4 || '',
      finale: data.visualisation?.finale || '',
    },
  };
}
