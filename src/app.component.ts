
import { ChangeDetectionStrategy, Component, ElementRef, viewChild, signal, computed, effect, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { GeminiService } from './services/gemini.service';
import { DocType, DocumentContent, Resume, Invoice, Newsletter, Report } from './models/document.model';
import { translations } from './translations';

// Declare global libraries to TypeScript
declare const html2canvas: any;
declare const jspdf: any;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  documentPreview = viewChild.required<ElementRef>('documentPreview');
  
  docType = signal<DocType>('resume');
  description = signal('');
  uploadedImage = signal<string | null>(null);
  
  isLoading = signal(false);
  statusMessage = signal<{ type: 'error' | 'success' | 'info'; text: string } | null>(null);
  generatedContent = signal<DocumentContent>(null);

  private translations = translations;
  language = signal<'ar' | 'en'>('ar');
  t = computed(() => this.translations[this.language()]);
  
  isDownloadDisabled = computed(() => this.isLoading() || !this.generatedContent());

  constructor(
    private geminiService: GeminiService, 
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.statusMessage.set({
        type: 'info',
        text: this.t().statusReady
    });

    if (isPlatformBrowser(this.platformId)) {
      effect(() => {
        const lang = this.language();
        this.document.documentElement.lang = lang;
        this.document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        if (!this.generatedContent() && !this.isLoading()) {
          this.statusMessage.set({ type: 'info', text: this.t().statusReady });
        }
      });
    }
  }

  setLanguage(lang: 'ar' | 'en'): void {
    this.language.set(lang);
  }

  onDocTypeChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.docType.set(selectElement.value as DocType);
  }

  onDescriptionChange(event: Event): void {
    const textAreaElement = event.target as HTMLTextAreaElement;
    this.description.set(textAreaElement.value);
  }

  onFileChange(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const file = inputElement.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.uploadedImage.set(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }

  async generateDocument(): Promise<void> {
    if (!this.description().trim()) {
      this.statusMessage.set({ type: 'error', text: this.t().errorDescriptionRequired });
      return;
    }

    this.isLoading.set(true);
    this.statusMessage.set(null);
    this.generatedContent.set(null);
    
    try {
      const content = await this.geminiService.generateDocumentContent(this.docType(), this.description(), this.language());
      this.generatedContent.set(content);
      this.statusMessage.set({ type: 'success', text: this.t().statusSuccess });
    } catch (error: any) {
      console.error(error);
      this.statusMessage.set({ type: 'error', text: `${this.t().statusErrorPrefix}: ${error.message || 'Unexpected error'}` });
    } finally {
      this.isLoading.set(false);
    }
  }

  async downloadPDF(): Promise<void> {
    if (this.isDownloadDisabled()) return;

    const { jsPDF } = jspdf;
    const previewEl = this.documentPreview().nativeElement;

    try {
      const canvas = await html2canvas(previewEl, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save('AI_Smart_Document.pdf');
    } catch (error) {
      console.error("Could not generate PDF", error);
      this.statusMessage.set({ type: 'error', text: this.t().errorPdf });
    }
  }

  // Type guards for templates
  isResume(content: DocumentContent): content is Resume {
    return this.docType() === 'resume' && content !== null;
  }
  isInvoice(content: DocumentContent): content is Invoice {
    return this.docType() === 'invoice' && content !== null;
  }
  isNewsletter(content: DocumentContent): content is Newsletter {
    return this.docType() === 'newsletter' && content !== null;
  }
  isReport(content: DocumentContent): content is Report {
    return this.docType() === 'report' && content !== null;
  }
}
