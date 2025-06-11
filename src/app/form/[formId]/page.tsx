
"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getForm, FormSchemaForFirestore, saveFormResponse } from '@/services/formService';
import type { Question } from '@/app/forms/create/page'; 
import type { Timestamp } from 'firebase/firestore';
import type { NotificationDestination } from '@/services/formService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { sendFormSubmissionEmail } from '@/actions/sendFormEmail';
import { sendDiscordNotification } from '@/actions/sendDiscordNotification';

interface PublicFormDisplayData extends Omit<FormSchemaForFirestore, 'createdAt' | 'questions' | 'title'> {
  id: string; 
  title: string; 
  questions: Question[]; 
  createdAt: Timestamp | string; 
  backgroundImageUrl?: string | null;
  notificationDestination?: NotificationDestination;
  receiverEmail?: string | null;
  discordWebhookUrl?: string | null;
}

function PublicFormLayout({ children, backgroundImageUrl }: { children: React.ReactNode; backgroundImageUrl?: string | null; }) {
  const layoutStyle: React.CSSProperties = {
    position: 'relative', // Needed for the overlay
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem', // p-4
    backgroundRepeat: 'no-repeat',
  };

  if (backgroundImageUrl) {
    layoutStyle.backgroundImage = `url(${backgroundImageUrl})`;
    layoutStyle.backgroundSize = 'cover';
    layoutStyle.backgroundPosition = 'center';
    layoutStyle.backgroundAttachment = 'fixed'; // Keep background fixed during scroll
  } else {
    layoutStyle.backgroundColor = 'hsl(var(--muted))'; // Fallback bg
  }

  return (
    <div style={layoutStyle}>
      {/* Overlay for readability when background image is present */}
      {backgroundImageUrl && (
        <div 
          className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-0"
          aria-hidden="true"
        ></div>
      )}
      <div className="w-full max-w-2xl relative z-10"> {/* Content on top of overlay */}
        {children}
      </div>
      <footer className="py-6 mt-8 text-center text-sm relative z-10">
        <span className="bg-background/80 dark:bg-background/90 text-muted-foreground px-3 py-1.5 rounded-md shadow">Powered by XPMail & Forms</span>
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
              createdAt: data.createdAt, 
              backgroundImageUrl: data.backgroundImageUrl || null, 
              notificationDestination: data.notificationDestination || "none",
              receiverEmail: data.receiverEmail || null,
              discordWebhookUrl: data.discordWebhookUrl || null,
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
    
    // Validate required fields
    for (const question of form.questions) {
      if (question.isRequired) {
        const response = formResponses[question.id || question.text];
        if (response === undefined || response === null || (Array.isArray(response) && response.length === 0) || (typeof response === 'string' && response.trim() === '')) {
          toast({
            title: "Missing Required Field",
            description: `Please answer the question: "${question.text}"`,
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
      }
    }
    
    try {
      await saveFormResponse(formId, formResponses);
      console.log('Form Responses Saved to Firestore:', formResponses);
      setSubmissionMessage('Thank you! Your form has been submitted successfully.');
      
      console.log('Form notification config:', {
        destination: form.notificationDestination,
        email: form.receiverEmail,
        webhook: form.discordWebhookUrl,
        title: form.title
      });

      if (form.notificationDestination === "email" && form.receiverEmail && form.title) {
        console.log(`Attempting to send email to: ${form.receiverEmail} for form: ${form.title}`);
        const emailResult = await sendFormSubmissionEmail({
          to: form.receiverEmail,
          formTitle: form.title,
          responseData: formResponses,
        });
        console.log('Email send result:', emailResult);
        if (!emailResult.success) {
           toast({
            title: "Notification Issue (Email)",
            description: `Form submitted, but email notification failed: ${emailResult.message || 'Unknown error.'}. Please check server logs.`,
            variant: "default", 
            duration: 8000,
          });
        }
      } else if (form.notificationDestination === "discord" && form.discordWebhookUrl && form.title) {
        console.log(`Attempting to send Discord notification for form: ${form.title}`);
        const discordResult = await sendDiscordNotification(
            form.discordWebhookUrl,
            form.title,
            formResponses
        );
        console.log('Discord notification send result:', discordResult);
        if (!discordResult.success) {
           toast({
            title: "Notification Issue (Discord)",
            description: `Form submitted, but Discord notification failed: ${discordResult.message || 'Unknown error.'}. Please check server logs.`,
            variant: "default", 
            duration: 8000,
          });
        }
      } else {
        console.log('No valid notification configured or title missing for this form. Skipping notification.', {
            destination: form.notificationDestination, 
            receiverEmail: form.receiverEmail, 
            discordWebhookUrl: form.discordWebhookUrl,
            title: form.title 
        });
      }
      setFormResponses({}); 
    } catch (submissionError) {
      console.error("Failed to submit form response to Firestore:", submissionError);
      const errMsg = submissionError instanceof Error ? submissionError.message : "Could not submit your response. Please try again.";
      toast({ title: "Submission Failed", description: errMsg, variant: "destructive" });
      setSubmissionMessage(`Error: ${errMsg}`); 
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PublicFormLayout>
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          <Spinner size={48} />
          <p className="mt-4 text-muted-foreground bg-background/70 dark:bg-background/90 px-3 py-1.5 rounded-md shadow">Loading form...</p>
        </div>
      </PublicFormLayout>
    );
  }

  if (error) {
    return (
       <PublicFormLayout>
        <Card className="shadow-lg bg-card/90 dark:bg-card/95 backdrop-blur-md">
          <CardHeader className="items-center">
            <AlertTriangle className="w-12 h-12 text-destructive mb-2" />
            <CardTitle className="text-2xl text-destructive">Error Loading Form</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-card-foreground/80">{error}</p>
          </CardContent>
        </Card>
      </PublicFormLayout>
    );
  }

  if (!form) { 
     return (
       <PublicFormLayout>
        <Card className="shadow-lg bg-card/90 dark:bg-card/95 backdrop-blur-md">
          <CardHeader className="items-center">
             <AlertTriangle className="w-12 h-12 text-destructive mb-2" />
            <CardTitle className="text-2xl">Form Not Found</CardTitle>
          </CardHeader>
           <CardContent className="text-center">
            <p className="text-card-foreground/80">The requested form could not be found or may have been deleted.</p>
          </CardContent>
        </Card>
      </PublicFormLayout>
    );
  }
  
  if (submissionMessage && submissionMessage.startsWith('Thank you')) {
    return (
      <PublicFormLayout backgroundImageUrl={form.backgroundImageUrl}>
        <Card className="shadow-xl w-full bg-card/90 dark:bg-card/95 backdrop-blur-md">
          <CardHeader className="items-center">
            <CardTitle className="text-3xl font-headline text-center">{form.title}</CardTitle>
          </CardHeader>
          <CardContent className="text-center py-10">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <p className="text-xl font-semibold">{submissionMessage}</p>
            <p className="text-card-foreground/80 mt-2">You can now close this page.</p>
          </CardContent>
        </Card>
      </PublicFormLayout>
    );
  }

  return (
    <PublicFormLayout backgroundImageUrl={form.backgroundImageUrl}>
      <Card className="shadow-xl w-full bg-card/90 dark:bg-card/95 backdrop-blur-md selection:bg-primary/20">
        <CardHeader>
          <CardTitle className="text-3xl font-headline text-center">{form.title}</CardTitle>
          {form.questions.length > 0 && (
             <CardDescription className="text-center pt-2 text-card-foreground/80">Please fill out the form below.</CardDescription>
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
                <div key={q.id || q.text} className="p-4 sm:p-5 border rounded-lg bg-background/80 dark:bg-background/70 shadow-md hover:shadow-lg backdrop-blur-sm transition-all">
                  <Label htmlFor={q.id || q.text} className="block text-md font-semibold mb-3 text-foreground dark:text-foreground">
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
                      className="bg-white/70 dark:bg-black/20 border-input focus:border-primary"
                    />
                  )}
                  {q.type === 'email' && (
                    <Input
                      id={q.id || q.text}
                      type="email"
                      required={q.isRequired}
                      onChange={(e) => handleInputChange(q.id || q.text, e.target.value)}
                      value={formResponses[q.id || q.text] || ''}
                       className="bg-white/70 dark:bg-black/20 border-input focus:border-primary"
                    />
                  )}
                  {q.type === 'number' && (
                    <Input
                      id={q.id || q.text}
                      type="number"
                      required={q.isRequired}
                      onChange={(e) => handleInputChange(q.id || q.text, e.target.value)}
                      value={formResponses[q.id || q.text] || ''}
                       className="bg-white/70 dark:bg-black/20 border-input focus:border-primary"
                    />
                  )}
                  {q.type === 'textarea' && ( 
                     <Textarea
                      id={q.id || q.text}
                      required={q.isRequired}
                      onChange={(e) => handleInputChange(q.id || q.text, e.target.value)}
                      value={formResponses[q.id || q.text] || ''}
                      className="bg-white/70 dark:bg-black/20 border-input focus:border-primary"
                      rows={4}
                    />
                  )}
                  {q.type === 'multiple-choice' && q.options && (
                    <RadioGroup
                      required={q.isRequired}
                      onValueChange={(value) => handleInputChange(q.id || q.text, value)}
                      value={formResponses[q.id || q.text] || undefined}
                      className="space-y-2"
                    >
                      {q.options.map((opt) => (
                        <div key={opt.id || opt.value} className="flex items-center space-x-3 p-3 bg-white/50 dark:bg-black/10 hover:bg-primary/10 dark:hover:bg-primary/20 rounded-md transition-colors cursor-pointer border border-transparent hover:border-primary/30">
                          <RadioGroupItem value={opt.value} id={`${q.id || q.text}-${opt.id || opt.value}`} />
                          <Label htmlFor={`${q.id || q.text}-${opt.id || opt.value}`} className="font-normal cursor-pointer flex-1 text-foreground/90 dark:text-foreground/80">{opt.value}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}
                  {q.type === 'checkbox' && q.options && (
                    <div className="space-y-2">
                      {q.options.map((opt) => (
                        <div key={opt.id || opt.value} className="flex items-center space-x-3 p-3 bg-white/50 dark:bg-black/10 hover:bg-primary/10 dark:hover:bg-primary/20 rounded-md transition-colors cursor-pointer border border-transparent hover:border-primary/30">
                          <Checkbox
                            id={`${q.id || q.text}-${opt.id || opt.value}`}
                            onCheckedChange={(checked) => handleCheckboxChange(q.id || q.text, opt.value, !!checked)}
                            checked={(formResponses[q.id || q.text] || []).includes(opt.value)}
                          />
                          <Label htmlFor={`${q.id || q.text}-${opt.id || opt.value}`} className="font-normal cursor-pointer flex-1 text-foreground/90 dark:text-foreground/80">{opt.value}</Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <Button type="submit" className="w-full text-lg py-6 mt-8 font-semibold" disabled={isSubmitting}>
                {isSubmitting ? <Spinner className="mr-2" size={20} /> : null}
                {isSubmitting ? 'Submitting...' : 'Submit Form'}
              </Button>
            </form>
          ) : (
             <div className="text-center py-10">
                <p className="text-card-foreground/80">This form doesn't have any questions yet. Please check back later.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </PublicFormLayout>
  );
}

