export interface StatItem {
  num: string;
  label: string;
}

export interface PipeStep {
  num: string;
  title: string;
  body: string;
  status: 'auto' | 'live' | 'partner';
}

export interface Metric {
  val: string;
  label: string;
}

export interface CaseCard {
  sector: string;
  name: string;
  body: string;
  metrics: Metric[];
}

export interface PriceTier {
  tier: string;
  name: string;
  range: string;
  note: string;
  features: string[];
  featured?: boolean;
}
