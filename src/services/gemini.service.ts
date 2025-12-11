
import { Injectable } from '@angular/core';
import { GoogleGenAI, Type } from "@google/genai";
import { DocType, DocumentContent } from '../models/document.model';

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    // Safely access the API key without crashing the app on startup.
    // The key must be set in the environment variables of the deployment platform (e.g., Netlify).
    const apiKey = (window as any).process?.env?.API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey: apiKey });
    } else {
      console.error("Gemini API Key is not configured. The application will load, but generation will fail.");
    }
  }

  private getPromptAndSchema(docType: DocType, description: string, lang: 'ar' | 'en') {
    const basePrompts = {
      ar: {
        resume: `أنت خبير في كتابة السير الذاتية الاحترافية. بناءً على الوصف التالي، قم بإنشاء سيرة ذاتية متكاملة باللغة العربية. الوصف: ${description}`,
        invoice: `أنت خبير في إنشاء الفواتير التجارية. بناءً على الوصف التالي، قم بإنشاء فاتورة احترافية باللغة العربية. الوصف: ${description}`,
        newsletter: `أنت كاتب محتوى محترف. بناءً على الوصف التالي، قم بإنشاء نشرة إخبارية جذابة باللغة العربية. الوصف: ${description}`,
        report: `أنت باحث أكاديمي محترف. بناءً على الوصف التالي، قم بإنشاء تقرير أكاديمي باللغة العربية. الوصف: ${description}`
      },
      en: {
        resume: `You are an expert in writing professional resumes. Based on the following description, create a complete resume in English. Description: ${description}`,
        invoice: `You are an expert in creating business invoices. Based on the following description, create a professional invoice in English. Description: ${description}`,
        newsletter: `You are a professional content writer. Based on the following description, create an engaging newsletter in English. Description: ${description}`,
        report: `You are a professional academic researcher. Based on the following description, create an academic report in English. Description: ${description}`
      }
    };

    const schemas = {
      resume: {
        type: Type.OBJECT,
        description: "A professional resume or curriculum vitae.",
        properties: {
          name: { type: Type.STRING, description: "The person's full name." },
          title: { type: Type.STRING, description: "The person's professional title (e.g., 'Senior Software Engineer')." },
          email: { type: Type.STRING, description: "Contact email address." },
          phone: { type: Type.STRING, description: "Contact phone number." },
          linkedin: { type: Type.STRING, description: "URL of the person's LinkedIn profile." },
          summary: { type: Type.STRING, description: "A 2-4 sentence professional summary." },
          experience: {
            type: Type.ARRAY,
            description: "A list of work experiences.",
            items: {
              type: Type.OBJECT,
              properties: {
                position: { type: Type.STRING, description: "The job title held." },
                company: { type: Type.STRING, description: "The name of the company." },
                period: { type: Type.STRING, description: "The dates of employment (e.g., '2020-Present')." },
                achievements: { type: Type.ARRAY, description: "A list of key achievements for this role.", items: { type: Type.STRING } }
              }
            }
          },
          education: {
            type: Type.ARRAY,
            description: "A list of educational qualifications.",
            items: {
              type: Type.OBJECT,
              properties: {
                degree: { type: Type.STRING, description: "The degree or qualification obtained (e.g., 'B.S. in Computer Science')." },
                institution: { type: Type.STRING, description: "The name of the educational institution." },
                period: { type: Type.STRING, description: "The dates of attendance (e.g., '2016-2020')." }
              }
            }
          },
          skills: { type: Type.ARRAY, description: "A list of relevant skills.", items: { type: Type.STRING } }
        }
      },
      invoice: {
        type: Type.OBJECT,
        description: "A commercial invoice for goods or services.",
        properties: {
          invoiceNumber: { type: Type.STRING, description: "The unique invoice identifier." },
          date: { type: Type.STRING, description: "The date the invoice was issued." },
          seller: { type: Type.OBJECT, description: "Information about the seller.", properties: { name: { type: Type.STRING }, address: { type: Type.STRING }, phone: { type: Type.STRING }, email: { type: Type.STRING } } },
          client: { type: Type.OBJECT, description: "Information about the client.", properties: { name: { type: Type.STRING }, address: { type: Type.STRING }, phone: { type: Type.STRING } } },
          items: {
            type: Type.ARRAY,
            description: "A list of line items in the invoice.",
            items: {
              type: Type.OBJECT,
              properties: { 
                description: { type: Type.STRING, description: "Description of the product or service." }, 
                quantity: { type: Type.NUMBER, description: "The quantity of the item." }, 
                price: { type: Type.NUMBER, description: "The price per unit of the item." }, 
                total: { type: Type.NUMBER, description: "The total price for the line item (quantity * price)." } 
              }
            }
          },
          total: { type: Type.STRING, description: "The grand total amount of the invoice." },
          currency: { type: Type.STRING, description: "The currency of the amounts (e.g., 'USD', 'SAR')." }
        }
      },
      newsletter: {
        type: Type.OBJECT,
        description: "A company or organization newsletter.",
        properties: {
          title: { type: Type.STRING, description: "The main title of the newsletter." },
          date: { type: Type.STRING, description: "The publication date of the newsletter." },
          mainNews: { type: Type.OBJECT, description: "The main story or article.", properties: { title: { type: Type.STRING, description: "Title of the main story." }, content: { type: Type.STRING, description: "Full content of the main story." } } },
          updates: { type: Type.ARRAY, description: "A list of brief updates or announcements.", items: { type: Type.STRING } },
          events: { type: Type.OBJECT, description: "Information about an upcoming event.", properties: { title: { type: Type.STRING, description: "Title of the event." }, content: { type: Type.STRING, description: "Details about the event (date, location, description)." } } }
        }
      },
      report: {
        type: Type.OBJECT,
        description: "A formal or academic report.",
        properties: {
          title: { type: Type.STRING, description: "The main title of the report." },
          subtitle: { type: Type.STRING, description: "The subtitle of the report." },
          author: { type: Type.STRING, description: "The name of the author(s)." },
          date: { type: Type.STRING, description: "The publication date of the report." },
          summary: { type: Type.STRING, description: "An executive summary of the report." },
          introduction: { type: Type.STRING, description: "The introduction section of the report." },
          findings: { type: Type.ARRAY, description: "A list of key findings or results.", items: { type: Type.STRING } },
          recommendations: { type: Type.STRING, description: "The recommendations section of the report." }
        }
      }
    };

    return { prompt: basePrompts[lang][docType], schema: schemas[docType] };
  }

  async generateDocumentContent(docType: DocType, description: string, lang: 'ar' | 'en'): Promise<DocumentContent> {
    if (!this.ai) {
      const errorMsg = lang === 'ar' 
        ? 'لم يتم تكوين مفتاح Gemini API. يرجى التأكد من إعداده في متغيرات البيئة الخاصة بالنشر.'
        : 'Gemini API key is not configured. Please ensure it is set in the deployment environment variables.';
      throw new Error(errorMsg);
    }

    const { prompt, schema } = this.getPromptAndSchema(docType, description, lang);
    const errorMessages = {
        ar: 'فشل في توليد المحتوى. يرجى المحاولة مرة أخرى.',
        en: 'Failed to generate content. Please try again.'
    }

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
        },
      });

      const jsonText = response.text.trim();
      return JSON.parse(jsonText);
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw new Error(errorMessages[lang]);
    }
  }
}
