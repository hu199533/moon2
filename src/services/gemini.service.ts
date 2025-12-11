
import { Injectable } from '@angular/core';
import { GoogleGenAI, Type } from "@google/genai";
import { DocType, DocumentContent } from '../models/document.model';

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    // API Key must be set in the environment variables
    if (!process.env.API_KEY) {
      throw new Error("API_KEY environment variable not set.");
    }
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
        properties: {
          name: { type: Type.STRING },
          title: { type: Type.STRING },
          email: { type: Type.STRING },
          phone: { type: Type.STRING },
          linkedin: { type: Type.STRING },
          summary: { type: Type.STRING },
          experience: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                position: { type: Type.STRING },
                company: { type: Type.STRING },
                period: { type: Type.STRING },
                achievements: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            }
          },
          education: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                degree: { type: Type.STRING },
                institution: { type: Type.STRING },
                period: { type: Type.STRING }
              }
            }
          },
          skills: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      },
      invoice: {
        type: Type.OBJECT,
        properties: {
          invoiceNumber: { type: Type.STRING },
          date: { type: Type.STRING },
          seller: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, address: { type: Type.STRING }, phone: { type: Type.STRING }, email: { type: Type.STRING } } },
          client: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, address: { type: Type.STRING }, phone: { type: Type.STRING } } },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: { description: { type: Type.STRING }, quantity: { type: Type.NUMBER }, price: { type: Type.NUMBER }, total: { type: Type.NUMBER } }
            }
          },
          total: { type: Type.STRING },
          currency: { type: Type.STRING }
        }
      },
      newsletter: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          date: { type: Type.STRING },
          mainNews: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, content: { type: Type.STRING } } },
          updates: { type: Type.ARRAY, items: { type: Type.STRING } },
          events: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, content: { type: Type.STRING } } }
        }
      },
      report: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          subtitle: { type: Type.STRING },
          author: { type: Type.STRING },
          date: { type: Type.STRING },
          summary: { type: Type.STRING },
          introduction: { type: Type.STRING },
          findings: { type: Type.ARRAY, items: { type: Type.STRING } },
          recommendations: { type: Type.STRING }
        }
      }
    };

    return { prompt: basePrompts[lang][docType], schema: schemas[docType] };
  }

  async generateDocumentContent(docType: DocType, description: string, lang: 'ar' | 'en'): Promise<DocumentContent> {
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
