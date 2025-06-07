
"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getForm, FormSchemaForFirestore, saveFormResponse } from '@/services/formService';
import type { Question } from '@/app/forms/create/page'; // Ensure Question type is available
import type { Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';


interface PublicFormDisplayData extends Omit<FormSchemaForFirestore, 'createdAt' | 'questions' | 'title'> {
  id: string; 
  title: string; 
  questions: Question[]; // Use the imported Question type
  createdAt: Timestamp | string;
  backgroundImageUrl?: string | null;
}

function PublicFormLayout({ children, backgroundImageUrl }: { children: React.ReactNode; backgroundImageUrl?: string | null; }) {
  const layoutStyle: React.CSSProperties = {};
  if (backgroundImageUrl) {
    layoutStyle.backgroundImage = `url(${backgroundImageUrl})`;
    layoutStyle.backgroundSize = 'cover';
    layoutStyle.backgroundPosition = 'center';
    layoutStyle.backgroundAttachment = 'fixed';
  }

  return (
    <div 
      className="flex min-h-screen flex-col items-center justify-center bg-muted p-4 selection:bg-primary/20"
      style={layoutStyle}
    >
      <div className="w-full max-w-2xl">
        {backgroundImageUrl && <div className="absolute inset-0 bg-black/30 backdrop-blur-sm z-0"></div>}
        <div className="relative z-10">
          {children}
        </div>
      </div>
      <footer className="py-6 mt-8 text-center text-sm text-muted-foreground relative z-10">
        <span className="bg-background/70 px-2 py-1 rounded">Powered by XPMail & Forms</span>
      </footer>
    </div>
  );
}


export default function PublicFormPage() {
  const params = useParams();
  const formId = params.formId as string;
  const { toast } = useToast();
  const [form, setForm] = useState<PublicFormDisplayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formResponses, setFormResponses] = useState<Record<string, any>>({});
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (formId) {
      setLoading(true);
      setError(null);
      setSubmissionMessage(null);
      getForm(formId)
        .then((data) => {
          if (data) {
             const typedQuestions: Question[] = (data.questions || []).map((q: any) => ({
              id: q.id || crypto.randomUUID(),
              text: q.text || '',
              type: q.type || 'text',
              isRequired: q.isRequired || false,
              options: (q.options || []).map((opt: any) => ({
                id: opt.id || crypto.randomUUID(),
                value: opt.value || '',
              })),
            }));

            const processedForm: PublicFormDisplayData = {
              ...data, 
              id: data.id || formId, 
              title: data.title || 'Untitled Form', 
              questions: typedQuestions, 
              backgroundImageUrl: data.backgroundImageUrl || null, 
            };
            setForm(processedForm);
          } else {
            setError('Form not found. Please check the link and try again.');
          }
        })
        .catch((e) => {
          console.error("Error fetching or processing form:", e);
          setError(`Failed to load form. ${e instanceof Error ? e.message : 'An unknown error occurred.'}`);
        })
        .finally(() => setLoading(false));
    }
  }, [formId]);

  const handleInputChange = (questionId: string, value: any) => {
    setFormResponses(prev => ({ ...prev, [questionId]: value }));
  };

  const handleCheckboxChange = (questionId: string, optionValue: string, checked: boolean) => {
    setFormResponses(prev => {
      const currentValues = prev[questionId] || [];
      if (checked) {
        return { ...prev, [questionId]: [...currentValues, optionValue] };
      } else {
        return { ...prev, [questionId]: currentValues.filter((val: string) => val !== optionValue) };
      }
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formId || !form) {
      toast({ title: "Error", description: "Form data is not available for submission.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    setSubmissionMessage(null);
    
    try {
      await saveFormResponse(formId, formResponses);
      console.log('Form Responses Saved:', formResponses);
      setSubmissionMessage('Thank you! Your form has been submitted successfully.');
      setFormResponses({}); // Clear responses after successful submission
    } catch (submissionError) {
      console.error("Failed to submit form response:", submissionError);
      const errMsg = submissionError instanceof Error ? submissionError.message : "Could not submit your response. Please try again.";
      toast({ title: "Submission Failed", description: errMsg, variant: "destructive" });
      setSubmissionMessage(`Error: ${errMsg}`); // Show error to user as well
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PublicFormLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <Spinner size={48} />
          <p className="mt-4 text-muted-foreground bg-background/70 px-2 py-1 rounded">Loading form...</p>
        </div>
      </PublicFormLayout>
    );
  }

  if (error) {
    return (
       <PublicFormLayout>
        <Card className="shadow-lg bg-card/90 backdrop-blur-sm">
          <CardHeader className="items-center">
            <AlertTriangle className="w-12 h-12 text-destructive mb-2" />
            <CardTitle className="text-2xl text-destructive">Error Loading Form</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </PublicFormLayout>
    );
  }

  if (!form) { 
     return (
       <PublicFormLayout>
        <Card className="shadow-lg bg-card/90 backdrop-blur-sm">
          <CardHeader className="items-center">
             <AlertTriangle className="w-12 h-12 text-destructive mb-2" />
            <CardTitle className="text-2xl">Form Not Found</CardTitle>
          </CardHeader>
           <CardContent className="text-center">
            <p className="text-muted-foreground">The requested form could not be found or may have been deleted.</p>
          </CardContent>
        </Card>
      </PublicFormLayout>
    );
  }
  
  if (submissionMessage && submissionMessage.startsWith('Thank you')) {
    return (
      <PublicFormLayout backgroundImageUrl={form.backgroundImageUrl}>
        <Card className="shadow-xl w-full bg-card/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-3xl font-headline text-center">{form.title}</CardTitle>
          </CardHeader>
          <CardContent className="text-center py-10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xl font-semibold">{submissionMessage}</p>
            <p className="text-muted-foreground mt-2">You can now close this page.</p>
          </CardContent>
        </Card>
      </PublicFormLayout>
    );
  }

  return (
    <PublicFormLayout backgroundImageUrl={form.backgroundImageUrl}>
      <Card className="shadow-xl w-full bg-card/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-3xl font-headline text-center">{form.title}</CardTitle>
          {form.questions.length > 0 && (
             <CardDescription className="text-center pt-2">Please fill out the form below.</CardDescription>
          )}
          {form.questions.length === 0 && (
             <CardDescription className="text-center pt-2 text-destructive">This form currently has no questions.</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {submissionMessage && submissionMessage.startsWith('Error:') && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive text-destructive rounded-md text-sm">
              {submissionMessage}
            </div>
          )}
          {form.questions.length > 0 ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {form.questions.map((q) => (
                <div key={q.id || q.text} className="p-4 border rounded-md bg-background/70 shadow-sm backdrop-blur-xs">
                  <Label htmlFor={q.id || q.text} className="block text-md font-medium mb-2.5">
                    {q.text}
                    {q.isRequired && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  {q.type === 'text' && (
                    <Input
                      id={q.id || q.text}
                      type="text"
                      required={q.isRequired}
                      onChange={(e) => handleInputChange(q.id || q.text, e.target.value)}
                      value={formResponses[q.id || q.text] || ''}
                    />
                  )}
                  {q.type === 'email' && (
                    <Input
                      id={q.id || q.text}
                      type="email"
                      required={q.isRequired}
                      onChange={(e) => handleInputChange(q.id || q.text, e.target.value)}
                      value={formResponses[q.id || q.text] || ''}
                    />
                  )}
                  {q.type === 'number' && (
                    <Input
                      id={q.id || q.text}
                      type="number"
                      required={q.isRequired}
                      onChange={(e) => handleInputChange(q.id || q.text, e.target.value)}
                      value={formResponses[q.id || q.text] || ''}
                    />
                  )}
                  {q.type === 'textarea' && ( // Assuming you might add textarea type
                     <Textarea
                      id={q.id || q.text}
                      required={q.isRequired}
                      onChange={(e) => handleInputChange(q.id || q.text, e.target.value)}
                      value={formResponses[q.id || q.text] || ''}
                    />
                  )}
                  {q.type === 'multiple-choice' && q.options && (
                    <RadioGroup
                      required={q.isRequired}
                      onValueChange={(value) => handleInputChange(q.id || q.text, value)}
                      value={formResponses[q.id || q.text] || undefined}
                      className="space-y-1"
                    >
                      {q.options.map((opt) => (
                        <div key={opt.id || opt.value} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-md transition-colors">
                          <RadioGroupItem value={opt.value} id={`${q.id || q.text}-${opt.id || opt.value}`} />
                          <Label htmlFor={`${q.id || q.text}-${opt.id || opt.value}`} className="font-normal cursor-pointer flex-1">{opt.value}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}
                  {q.type === 'checkbox' && q.options && (
                    <div className="space-y-1">
                      {q.options.map((opt) => (
                        <div key={opt.id || opt.value} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-md transition-colors">
                          <Checkbox
                            id={`${q.id || q.text}-${opt.id || opt.value}`}
                            onCheckedChange={(checked) => handleCheckboxChange(q.id || q.text, opt.value, !!checked)}
                            checked={(formResponses[q.id || q.text] || []).includes(opt.value)}
                          />
                          <Label htmlFor={`${q.id || q.text}-${opt.id || opt.value}`} className="font-normal cursor-pointer flex-1">{opt.value}</Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <Button type="submit" className="w-full text-lg py-6" disabled={isSubmitting}>
                {isSubmitting ? <Spinner className="mr-2" size={20} /> : null}
                {isSubmitting ? 'Submitting...' : 'Submit Form'}
              </Button>
            </form>
          ) : (
             <div className="text-center py-10">
                <p className="text-muted-foreground">This form doesn't have any questions yet. Please check back later.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </PublicFormLayout>
  );
}
