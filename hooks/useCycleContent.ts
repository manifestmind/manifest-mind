import content from '../assets/content/content_fr.json';

export function getCycleContent(cycleNumber: number) {
  const key = 'jour_' + cycleNumber;
  const data = (content as any)[key];
  if (!data) return null;
  return {
    theme: data.theme as string,
    jourSemaine: data.jour_semaine as string,
    phase: data.phase as string,
    affirmation: data.affirmation as string,
    actionFacile: data.action_facile as string,
    actionDifficile: data.action_difficile as string,
    visualisation: {
      p1: (data.visualisation?.p1 || '') as string,
      p2: (data.visualisation?.p2 || '') as string,
      p3: (data.visualisation?.p3 || '') as string,
      p4: (data.visualisation?.p4 || '') as string,
      finale: (data.visualisation?.finale || '') as string,
    },
  };
}
