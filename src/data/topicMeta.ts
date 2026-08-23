// Vizualni identitet teme na jednom mjestu. Prije je bio dupliciran u
// HomePage i StatsPage, pa je nova tema tražila dva usklađena unosa i tiho
// dobivala tuđe boje ako se drugi zaboravi.
//
// Klase su namjerno napisane kao pune literale (ne sastavljene iz dijelova) -
// Tailwind ih pronalazi samo ako doslovno postoje u izvoru.

export interface TopicMeta {
  description: string;
  icon: string;
  /** Kartica teme na naslovnici. */
  accent: string;
  iconSurface: string;
  progress: string;
  shadow: string;
  /** Statistika. */
  surface: string;
  scoreSurface: string;
  fill: string;
}

export const TOPIC_META: Record<string, TopicMeta> = {
  sql: {
    description: 'Od prvog SELECT-a do pametnih indeksa i brzih upita.',
    icon: '▤',
    accent: 'border-cyan-200 bg-cyan-50/70 hover:border-cyan-400',
    iconSurface: 'bg-cyan-100 text-cyan-900',
    progress: 'bg-cyan-400',
    shadow: 'shadow-[0_6px_0_#a5f3fc,0_16px_36px_rgba(14,116,144,0.08)] hover:shadow-[0_9px_0_#67e8f9,0_20px_42px_rgba(14,116,144,0.12)]',
    surface: 'border-cyan-200 bg-cyan-50/70',
    scoreSurface: 'border-cyan-200 bg-cyan-50',
    fill: 'bg-cyan-500',
  },
  frontend: {
    description: 'JavaScript, React, CSS i sve što korisnik vidi i dodiruje.',
    icon: '</>',
    accent: 'border-amber-200 bg-amber-50/75 hover:border-amber-400',
    iconSurface: 'bg-amber-100 text-amber-900',
    progress: 'bg-amber-400',
    shadow: 'shadow-[0_6px_0_#fde68a,0_16px_36px_rgba(180,83,9,0.08)] hover:shadow-[0_9px_0_#fcd34d,0_20px_42px_rgba(180,83,9,0.12)]',
    surface: 'border-amber-200 bg-amber-50/75',
    scoreSurface: 'border-amber-200 bg-amber-50',
    fill: 'bg-amber-500',
  },
  backend: {
    description: 'API-ji, sigurnost, arhitektura i skaliranje sustava.',
    icon: '⚙',
    accent: 'border-orange-200 bg-orange-50/75 hover:border-orange-400',
    iconSurface: 'bg-orange-100 text-orange-950',
    progress: 'bg-orange-500',
    shadow: 'shadow-[0_6px_0_#fed7aa,0_16px_36px_rgba(154,52,18,0.08)] hover:shadow-[0_9px_0_#fdba74,0_20px_42px_rgba(154,52,18,0.12)]',
    surface: 'border-orange-200 bg-orange-50/75',
    scoreSurface: 'border-orange-200 bg-orange-50',
    fill: 'bg-orange-500',
  },
  general: {
    description: 'Strukture podataka, Big-O, SOLID, Git i testiranje.',
    icon: '✦',
    accent: 'border-brand-200 bg-brand-50/75 hover:border-brand-400',
    iconSurface: 'bg-brand-100 text-brand-800',
    progress: 'bg-brand-500',
    shadow: 'shadow-[0_6px_0_#b8efc1,0_16px_36px_rgba(30,116,48,0.08)] hover:shadow-[0_9px_0_#82df91,0_20px_42px_rgba(30,116,48,0.12)]',
    surface: 'border-brand-200 bg-brand-50/75',
    scoreSurface: 'border-brand-200 bg-brand-50',
    fill: 'bg-brand-500',
  },
  devops: {
    description: 'Linux, Docker, CI/CD, Kubernetes i put koda do produkcije.',
    icon: '⬢',
    accent: 'border-violet-200 bg-violet-50/75 hover:border-violet-400',
    iconSurface: 'bg-violet-100 text-violet-900',
    progress: 'bg-violet-500',
    shadow: 'shadow-[0_6px_0_#ddd6fe,0_16px_36px_rgba(91,33,182,0.08)] hover:shadow-[0_9px_0_#c4b5fd,0_20px_42px_rgba(91,33,182,0.12)]',
    surface: 'border-violet-200 bg-violet-50/75',
    scoreSurface: 'border-violet-200 bg-violet-50',
    fill: 'bg-violet-500',
  },
  mreze: {
    description: 'TCP, DNS, HTTP, TLS i sve između preglednika i servera.',
    icon: '◈',
    accent: 'border-sky-200 bg-sky-50/75 hover:border-sky-400',
    iconSurface: 'bg-sky-100 text-sky-900',
    progress: 'bg-sky-500',
    shadow: 'shadow-[0_6px_0_#bae6fd,0_16px_36px_rgba(7,89,133,0.08)] hover:shadow-[0_9px_0_#7dd3fc,0_20px_42px_rgba(7,89,133,0.12)]',
    surface: 'border-sky-200 bg-sky-50/75',
    scoreSurface: 'border-sky-200 bg-sky-50',
    fill: 'bg-sky-500',
  },
  sigurnost: {
    description: 'OWASP, XSS, CSRF, lozinke, tajne i kako se to napada.',
    icon: '⛨',
    accent: 'border-rose-200 bg-rose-50/75 hover:border-rose-400',
    iconSurface: 'bg-rose-100 text-rose-900',
    progress: 'bg-rose-500',
    shadow: 'shadow-[0_6px_0_#fecdd3,0_16px_36px_rgba(159,18,57,0.08)] hover:shadow-[0_9px_0_#fda4af,0_20px_42px_rgba(159,18,57,0.12)]',
    surface: 'border-rose-200 bg-rose-50/75',
    scoreSurface: 'border-rose-200 bg-rose-50',
    fill: 'bg-rose-500',
  },
  'cudni-kutovi': {
    description: 'Zašto 0.1 + 0.2 nije 0.3, emoji, vrijeme i slavni bugovi.',
    icon: '◐',
    accent: 'border-fuchsia-200 bg-fuchsia-50/75 hover:border-fuchsia-400',
    iconSurface: 'bg-fuchsia-100 text-fuchsia-900',
    progress: 'bg-fuchsia-500',
    shadow: 'shadow-[0_6px_0_#f5d0fe,0_16px_36px_rgba(134,25,143,0.08)] hover:shadow-[0_9px_0_#f0abfc,0_20px_42px_rgba(134,25,143,0.12)]',
    surface: 'border-fuchsia-200 bg-fuchsia-50/75',
    scoreSurface: 'border-fuchsia-200 bg-fuchsia-50',
    fill: 'bg-fuchsia-500',
  },
  jezici: {
    description: 'Tipovi, memorija, pokazivači, dretve i kako jezik radi.',
    icon: '⟨⟩',
    accent: 'border-teal-200 bg-teal-50/75 hover:border-teal-400',
    iconSurface: 'bg-teal-100 text-teal-900',
    progress: 'bg-teal-500',
    shadow: 'shadow-[0_6px_0_#99f6e4,0_16px_36px_rgba(17,94,89,0.08)] hover:shadow-[0_9px_0_#5eead4,0_20px_42px_rgba(17,94,89,0.12)]',
    surface: 'border-teal-200 bg-teal-50/75',
    scoreSurface: 'border-teal-200 bg-teal-50',
    fill: 'bg-teal-500',
  },
  arhitektura: {
    description: 'Mikroservisi, obrasci, CAP i klasični system design zadaci.',
    icon: '◇',
    accent: 'border-indigo-200 bg-indigo-50/75 hover:border-indigo-400',
    iconSurface: 'bg-indigo-100 text-indigo-900',
    progress: 'bg-indigo-500',
    shadow: 'shadow-[0_6px_0_#c7d2fe,0_16px_36px_rgba(55,48,163,0.08)] hover:shadow-[0_9px_0_#a5b4fc,0_20px_42px_rgba(55,48,163,0.12)]',
    surface: 'border-indigo-200 bg-indigo-50/75',
    scoreSurface: 'border-indigo-200 bg-indigo-50',
    fill: 'bg-indigo-500',
  },
  praksa: {
    description: 'Scrum, code review, procjene, licence i razgovor za posao.',
    icon: '☰',
    accent: 'border-lime-200 bg-lime-50/75 hover:border-lime-400',
    iconSurface: 'bg-lime-100 text-lime-900',
    progress: 'bg-lime-500',
    shadow: 'shadow-[0_6px_0_#d9f99d,0_16px_36px_rgba(63,98,18,0.08)] hover:shadow-[0_9px_0_#bef264,0_20px_42px_rgba(63,98,18,0.12)]',
    surface: 'border-lime-200 bg-lime-50/75',
    scoreSurface: 'border-lime-200 bg-lime-50',
    fill: 'bg-lime-500',
  },
};

/** Nikad ne vraća undefined - nepoznata tema dobiva neutralan izgled. */
export function getTopicMeta(topicId: string): TopicMeta {
  return TOPIC_META[topicId] ?? TOPIC_META.general;
}
