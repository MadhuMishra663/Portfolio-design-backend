interface IProject {
  title?: string;
  description?: string;
  imageUrl?: string;
  github?: string;
  live?: string;
}

export interface IPortfolio {
  _id?: string;
  name: string;
  about?: string;
  email?: string;
  qualification?: string;
  profileImageUrl?: string;
  resumeUrl?: string;
  projects?: IProject[];
  linkedin?: string;
  github?: { heatmap?: string; streak?: string; langs?: string } | string;
  template?: string;
  slug?: string;
  role?: string;
  quote?: string;
  footer?: string;
  // any other fields your schema includes...
}
