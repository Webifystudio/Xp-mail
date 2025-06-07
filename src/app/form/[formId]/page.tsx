"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getForm, FormSchemaForFirestore } from '@/services/formService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

// Basic layout for public form page (no sidebar/auth needed for public view)
function PublicFormLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted p-4">
       <Link href="/" className="absolute top-4 left-4 text-primary hover:underline">
        &larr; Back to App
      </Link>
      <div className="w-full max-w-2xl">
        {children}
      </div>
      <footer className="py-6 mt-8 text-center text-sm text-muted-foreground">
        Powered by XPMail & Forms
      </footer>
    </div>
  );
}


export default function PublicFormPage() {
  const params = useParams();
  const formId = params.formId as string;
  const [form, setForm] = useState<FormSchemaForFirestore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formResponses, setFormResponses] = useState<Record<string, any>>({});

  useEffect(() => {
    if (formId) {
      setLoading(true);
      getForm(formId)
        .then((data) => {
          if (data) {
            setForm(data);
          } else {
            setError('Form not found.');
          }
        })
        .catch((e) => {
          console.error(e);
          setError('Failed to load form.');
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
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement submission logic (e.g., save responses to Firestore)
    alert('Form submission is not yet implemented. Responses: ' + JSON.stringify(formResponses, null, 2));
  };

  if (loading) {
    return (
      <PublicFormLayout>
        <div className="flex items-center justify-center h-64">
          <Spinner size={48} />
        </div>
      </PublicFormLayout>
    );
  }

  if (error) {
    return (
       <PublicFormLayout>
        <Card className="shadow-lg">
          <CardHeader className="items-center">
            <AlertTriangle className="w-12 h-12 text-destructive mb-2" />
            <CardTitle className="text-2xl text-destructive">Error Loading Form</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">{error}</p>
            <Button asChild className="mt-4">
              <Link href="/">Go to Homepage</Link>
            </Button>
          </CardContent>
        </Card>
      </PublicFormLayout>
    );
  }

  if (!form) {
    // This case should ideally be handled by the error state from getForm
     return (
       <PublicFormLayout>
        <Card className="shadow-lg">
          <CardHeader className="items-center">
             <AlertTriangle className="w-12 h-12 text-destructive mb-2" />
            <CardTitle className="text-2xl">Form Not Found</CardTitle>
          </CardHeader>
           <CardContent className="text-center">
            <p className="text-muted-foreground">The requested form could not be found.</p>
             <Button asChild className="mt-4">
              <Link href="/">Go to Homepage</Link>
            </Button>
          </CardContent>
        </Card>
      </PublicFormLayout>
    );
  }

  return (
    <PublicFormLayout>
      <Card className="shadow-xl w-full">
        <CardHeader>
          <CardTitle className="text-3xl font-headline text-center">{form.title}</CardTitle>
          <CardDescription className="text-center">Please fill out the form below.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {form.questions.map((q) => (
              <div key={q.id || q.text} className="p-4 border rounded-md bg-background/50">
                <Label htmlFor={q.id || q.text} className="block text-md font-medium mb-2">
                  {q.text}
                  {q.isRequired && <span className="text-destructive ml-1">*</span>}
                </Label>
                {q.type === 'text' && (
                  <Input
                    id={q.id || q.text}
                    type="text"
                    required={q.isRequired}
                    onChange={(e) => handleInputChange(q.id || q.text, e.target.value)}
                  />
                )}
                {q.type === 'email' && (
                  <Input
                    id={q.id || q.text}
                    type="email"
                    required={q.isRequired}
                    onChange={(e) => handleInputChange(q.id || q.text, e.target.value)}
                  />
                )}
                {q.type === 'number' && (
                  <Input
                    id={q.id || q.text}
                    type="number"
                    required={q.isRequired}
                    onChange={(e) => handleInputChange(q.id || q.text, e.target.value)}
                  />
                )}
                {q.type === 'multiple-choice' && q.options && (
                  <RadioGroup
                    required={q.isRequired}
                    onValueChange={(value) => handleInputChange(q.id || q.text, value)}
                  >
                    {q.options.map((opt) => (
                      <div key={opt.id || opt.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={opt.value} id={`${q.id || q.text}-${opt.id || opt.value}`} />
                        <Label htmlFor={`${q.id || q.text}-${opt.id || opt.value}`}>{opt.value}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
                {q.type === 'checkbox' && q.options && (
                  <div className="space-y-2">
                    {q.options.map((opt) => (
                      <div key={opt.id || opt.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${q.id || q.text}-${opt.id || opt.value}`}
                          onCheckedChange={(checked) => handleCheckboxChange(q.id || q.text, opt.value, !!checked)}
                        />
                        <Label htmlFor={`${q.id || q.text}-${opt.id || opt.value}`}>{opt.value}</Label>
                      </div>
                    ))}
                  </div>
                )}
                {/* Note: Textarea type was not in select, but if it were: */}
                {/* {q.type === 'textarea' && (
                  <Textarea id={q.id} required={q.isRequired} onChange={(e) => handleInputChange(q.id, e.target.value)} />
                )} */}
              </div>
            ))}
            <Button type="submit" className="w-full">
              Submit Form
            </Button>
          </form>
        </CardContent>
      </Card>
    </PublicFormLayout>
  );
}
