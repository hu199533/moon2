
export type DocType = 'resume' | 'invoice' | 'newsletter' | 'report';

export interface Resume {
  name: string;
  title: string;
  email: string;
  phone: string;
  linkedin: string;
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: string[];
}

export interface Experience {
  position: string;
  company: string;
  period: string;
  achievements: string[];
}

export interface Education {
  degree: string;
  institution: string;
  period: string;
}

export interface Invoice {
  invoiceNumber: string;
  date: string;
  seller: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
  client: {
    name: string;
    address: string;
    phone: string;
  };
  items: InvoiceItem[];
  total: string;
  currency: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Newsletter {
  title: string;
  date: string;
  mainNews: {
    title: string;
    content: string;
  };
  updates: string[];
  events: {
    title: string;
    content: string;
  };
}

export interface Report {
  title: string;
  subtitle: string;
  author: string;
  date: string;
  summary: string;
  introduction: string;
  findings: string[];
  recommendations: string;
}

export type DocumentContent = Resume | Invoice | Newsletter | Report | null;
