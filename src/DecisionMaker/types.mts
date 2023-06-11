export enum Decisions {
  text = 'text',
  image = 'image',
  error = 'error',
}

export type Decision = {
  decision: Decisions,
  data: string,
};

export interface DecisionMaker {
  decide(content: string): Promise<Decision>;
}
