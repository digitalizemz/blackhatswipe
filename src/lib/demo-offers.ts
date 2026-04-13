export interface Offer {
  id: number
  title: string
  niche: string
  platform: string
  type: string
  lang: string
  /** equals todayAds — kept for backward-compat sort in offers-section */
  ads: number
  days: number
  status: 'Scaling' | 'New'
  gradient: string // key into gradientMap in offer-maps.ts
  todayAds: number
  yesterdayAds: number
}

export const demoOffers: Offer[] = [
  { id: 1,  title: 'Celtic Salt Trick – Vigor Peak',        niche: 'Sexual Health',  platform: 'Facebook', type: 'VSL',  lang: 'EN', days: 2,  status: 'Scaling', gradient: 'blue',    todayAds: 52001, yesterdayAds: 48500, ads: 52001  },
  { id: 2,  title: 'Protocolo de Reset Cerebral',           niche: 'Brain & Memory', platform: 'Facebook', type: 'VSL',  lang: 'PT', days: 2,  status: 'Scaling', gradient: 'purple',  todayAds: 62001, yesterdayAds: 59000, ads: 62001  },
  { id: 3,  title: 'Truque com Raiz Vermelha',              niche: 'Vision',         platform: 'Facebook', type: 'VSL',  lang: 'EN', days: 18, status: 'Scaling', gradient: 'red',     todayAds: 50001, yesterdayAds: 51200, ads: 50001  },
  { id: 4,  title: 'Reversal Ritual – Glyco Lean',          niche: 'Weight Loss',    platform: 'Facebook', type: 'VSL',  lang: 'EN', days: 2,  status: 'Scaling', gradient: 'green',   todayAds: 42514, yesterdayAds: 38000, ads: 42514  },
  { id: 5,  title: 'Pink Salt Trick – Neuro Salt',          niche: 'Brain & Memory', platform: 'Facebook', type: 'VSL',  lang: 'EN', days: 2,  status: 'Scaling', gradient: 'pink',    todayAds: 30135, yesterdayAds: 27400, ads: 30135  },
  { id: 6,  title: 'GLP-1 Natural – LipoMax',               niche: 'Weight Loss',    platform: 'Facebook', type: 'VSL',  lang: 'EN', days: 1,  status: 'Scaling', gradient: 'emerald', todayAds: 18670, yesterdayAds: 22000, ads: 18670  },
  { id: 7,  title: 'The Gelatin Trick – Mounja Gummy',      niche: 'Weight Loss',    platform: 'Facebook', type: 'VSL',  lang: 'EN', days: 2,  status: 'Scaling', gradient: 'orange',  todayAds: 15246, yesterdayAds: 14800, ads: 15246  },
  { id: 8,  title: 'Cholesterol Brain Hack – Primal Brain', niche: 'Brain & Memory', platform: 'Facebook', type: 'VSL',  lang: 'EN', days: 2,  status: 'Scaling', gradient: 'indigo',  todayAds: 11133, yesterdayAds: 10500, ads: 11133  },
  { id: 9,  title: 'Café Bariátrico',                       niche: 'Weight Loss',    platform: 'YouTube',  type: 'VSL',  lang: 'PT', days: 30, status: 'New',     gradient: 'amber',   todayAds: 6,     yesterdayAds: 4,     ads: 6      },
  { id: 10, title: 'Escudo de Microplástico',               niche: 'Longevity',      platform: 'Facebook', type: 'VSL',  lang: 'EN', days: 1,  status: 'Scaling', gradient: 'teal',    todayAds: 9568,  yesterdayAds: 9100,  ads: 9568   },
  { id: 11, title: 'Farmacopéia Temperista',                niche: 'Gut Health',     platform: 'Facebook', type: 'Quiz', lang: 'PT', days: 18, status: 'Scaling', gradient: 'lime',    todayAds: 7407,  yesterdayAds: 8200,  ads: 7407   },
  { id: 12, title: 'Ancient Honey Ritual – Brain Honey',    niche: 'Brain & Memory', platform: 'Facebook', type: 'VSL',  lang: 'EN', days: 1,  status: 'Scaling', gradient: 'yellow',  todayAds: 4200,  yesterdayAds: 3900,  ads: 4200   },
]
