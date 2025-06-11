
"use client";

import type { ChangeEvent } from 'react';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from 'next/image';
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, Trash2, AlertCircle, UploadCloud, ImageIcon, Mail as MailIcon, MessageSquare, Webhook, XCircle } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { saveForm } from "@/services/formService";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { uploadToImgBB } from '@/services/imageService';

const IMG_BB_API_KEY = "2bb2346a6a907388d8a3b0beac2bca86";

const questionOptionSchema = z.object({
  id: z.string().optional(),
  value: z.string().min(1, "Option value cannot be empty"),
});
export type QuestionOption = z.infer<typeof questionOptionSchema>;

const questionSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1, "Question text is required"),
  type: z.enum(["text", "email", "number", "multiple-choice", "checkbox"], {
    required_error: "Question type is required",
  }),
  options: z.array(questionOptionSchema).optional(),
  isRequired: z.boolean().default(false),
});
export type Question = z.infer<typeof questionSchema>;

const formBuilderSchema = z.object({
  title: z.string().min(1, "Form title is required"),
  questions: z.array(questionSchema).min(1, "Add at least one question to the form."),
  backgroundImageUrl: z.string().url("Must be a valid URL").optional().nullable(),
  notificationDestination: z.enum(["none", "email", "discord"]).default("none"),
  receiverEmail: z.string().optional().nullable(),
  discordWebhookUrl: z.string().url().optional().nullable(),
}).superRefine((data, ctx) => {
  if (data.notificationDestination === "email") {
    if (!data.receiverEmail || data.receiverEmail.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Email address is required for email notifications.",
        path: ["receiverEmail"],
      });
    } else if (!z.string().email().safeParse(data.receiverEmail).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid email address format.",
        path: ["receiverEmail"],
      });
    }
  }
  if (data.notificationDestination === "discord") {
     if (!data.discordWebhookUrl || data.discordWebhookUrl.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Discord webhook URL is required for Discord notifications.",
        path: ["discordWebhookUrl"],
      });
    }
    // URL validation is already handled by z.string().url() for discordWebhookUrl
  }
});

type FormBuilderValues = z.infer<typeof formBuilderSchema>;

export default function CreateFormPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [formLink, setFormLink] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [bgImageFile, setBgImageFile] = useState<File | null>(null);
  const [isUploadingBg, setIsUploadingBg] = useState(false);
  const [bgImageError, setBgImageError] = useState<string | null>(null);

  const form = useForm<FormBuilderValues>({
    resolver: zodResolver(formBuilderSchema),
    defaultValues: {
      title: "",
      questions: [{ text: "", type: "text", options: [], isRequired: false }],
      backgroundImageUrl: null,
      notificationDestination: "none",
      receiverEmail: "",
      discordWebhookUrl: "",
    },
  });

  const { fields: questions, append: appendQuestion, remove: removeQuestion } = useFieldArray({
    control: form.control,
    name: "questions",
  });

  const notificationDestination = form.watch("notificationDestination");
  const currentBackgroundImageUrl = form.watch("backgroundImageUrl");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);


  const handleBgImageSelect = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
        setBgImageError("Image size should not exceed 4MB.");
        setBgImageFile(null);
        if (event.target) event.target.value = ''; // Reset file input
        return;
      }
      setBgImageFile(file);
      setBgImageError(null);
    }
  };

  const handleBgImageUpload = async () => {
    if (!bgImageFile) {
      setBgImageError("Please select an image file first.");
      return;
    }
    setIsUploadingBg(true);
    setBgImageError(null);
    try {
      const imageUrl = await uploadToImgBB(IMG_BB_API_KEY, bgImageFile);
      form.setValue("backgroundImageUrl", imageUrl, { shouldValidate: true });
      toast({ title: "Background Image Uploaded!", description: "The image is ready to be saved with the form." });
      setBgImageFile(null); 
      const fileInput = document.getElementById('bg-image-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = ''; // Reset file input
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "Unknown error during upload.";
      setBgImageError(errMsg);
      toast({ title: "Background Upload Failed", description: errMsg, variant: "destructive" });
    } finally {
      setIsUploadingBg(false);
    }
  };

  const removeBackgroundImage = () => {
    form.setValue("backgroundImageUrl", null, { shouldValidate: true });
    setBgImageFile(null);
    const fileInput = document.getElementById('bg-image-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = ''; // Reset file input
    toast({ title: "Background Image Removed."});
  };

  if (authLoading || !user) {
    return (
      <AppLayout>
        <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
          <Spinner size={48} />
        </div>
      </AppLayout>
    );
  }

  const onSubmit = async (data: FormBuilderValues) => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to create a form.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    setFormLink(null);

    const processedData: any = {
      title: data.title,
      questions: data.questions.map(q => ({
        ...q,
        id: q.id || crypto.randomUUID(),
        options: q.options?.map(opt => ({ ...opt, id: opt.id || crypto.randomUUID() }))
      })),
      backgroundImageUrl: data.backgroundImageUrl || null,
      notificationDestination: data.notificationDestination,
      receiverEmail: data.notificationDestination === "email" ? data.receiverEmail : null,
      discordWebhookUrl: data.notificationDestination === "discord" ? data.discordWebhookUrl : null,
    };
    
    try {
      const formId = await saveForm(user.uid, processedData);
      setFormLink(`/form/${formId}`);
      toast({ title: "Form Created!", description: "Your form has been saved successfully." });
      form.reset({ 
        title: "", 
        questions: [{ text: "", type: "text", options: [], isRequired: false }],
        backgroundImageUrl: null,
        notificationDestination: "none",
        receiverEmail: "",
        discordWebhookUrl: ""
      });
      const fileInput = document.getElementById('bg-image-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = ''; // Reset file input on successful form save too
    } catch (error) {
      console.error("Failed to save form:", error);
      toast({ title: "Error", description: (error as Error).message || "Could not save the form. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <AppLayout>
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Create New Form</CardTitle>
          <CardDescription>Design your custom form. Add a title, questions, and configure notifications.</CardDescription>
        </CardHeader>
        <CardContent>
          {formLink && (
            <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md">
              <p className="font-semibold">Form created successfully!</p>
              <p>
                Public link: <Link href={formLink} className="underline hover:text-green-900" target="_blank" rel="noopener noreferrer">{formLink}</Link>
              </p>
            </div>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold">Form Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Customer Feedback Survey" {...field} value={field.value || ""} className="text-base" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Card className="p-4 bg-muted/30">
                <CardHeader className="p-0 pb-3">
                    <CardTitle className="text-lg font-semibold flex items-center">
                        <MessageSquare className="mr-2 h-5 w-5 text-primary" /> Submission Notifications
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0 space-y-4">
                    <FormField
                        control={form.control}
                        name="notificationDestination"
                        render={({ field }) => (
                            <FormItem className="space-y-2">
                            <FormLabel>Send notifications to:</FormLabel>
                            <FormControl>
                                <RadioGroup
                                onValueChange={(value) => {
                                    field.onChange(value);
                                    // Clear other fields and errors when selection changes
                                    if (value !== 'email') form.setValue('receiverEmail', '', { shouldValidate: true });
                                    if (value !== 'discord') form.setValue('discordWebhookUrl', '', { shouldValidate: true });
                                }}
                                value={field.value}
                                className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0"
                                >
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                    <RadioGroupItem value="none" id="notify-none"/>
                                    </FormControl>
                                    <FormLabel htmlFor="notify-none" className="font-normal">None</FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                    <RadioGroupItem value="email" id="notify-email"/>
                                    </FormControl>
                                    <FormLabel htmlFor="notify-email" className="font-normal flex items-center"><MailIcon className="mr-1 h-4 w-4"/>Email</FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                    <RadioGroupItem value="discord" id="notify-discord"/>
                                    </FormControl>
                                    <FormLabel htmlFor="notify-discord" className="font-normal flex items-center"><Webhook className="mr-1 h-4 w-4"/>Discord</FormLabel>
                                </FormItem>
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />

                    {notificationDestination === "email" && (
                        <FormField
                            control={form.control}
                            name="receiverEmail"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center">
                                <MailIcon className="mr-2 h-4 w-4 text-muted-foreground" /> Notification Email Address
                                </FormLabel>
                                <FormControl>
                                <Input 
                                    type="email" 
                                    placeholder="e.g., your-team@example.com" 
                                    {...field} 
                                    value={field.value || ""} 
                                />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    )}

                    {notificationDestination === "discord" && (
                        <FormField
                            control={form.control}
                            name="discordWebhookUrl"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center">
                                <Webhook className="mr-2 h-4 w-4 text-muted-foreground" /> Discord Webhook URL
                                </FormLabel>
                                <FormControl>
                                <Input 
                                    type="url" 
                                    placeholder="https://discord.com/api/webhooks/..." 
                                    {...field} 
                                    value={field.value || ""} 
                                />
                                </FormControl>
                                <FormDescription>Copy this from your Discord server's integration settings.</FormDescription>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    )}
                </CardContent>
              </Card>
              
              <Card className="p-4 bg-muted/30">
                <CardHeader className="p-0 pb-3">
                    <CardTitle className="text-lg font-semibold flex items-center">
                        <ImageIcon className="mr-2 h-5 w-5 text-primary" /> Form Background Image (Optional)
                    </CardTitle>
                    <CardDescription>Max file size: 4MB.</CardDescription>
                </CardHeader>
                <CardContent className="p-0 space-y-3">
                    <div className="space-y-1">
                        <Label htmlFor="bg-image-upload">Upload Image</Label>
                        <Input 
                            id="bg-image-upload" 
                            type="file" 
                            accept="image/jpeg,image/png,image/gif,image/webp" 
                            onChange={handleBgImageSelect} 
                            className="text-sm file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:bg-muted file:text-muted-foreground hover:file:bg-primary/10"
                        />
                        {bgImageFile && <p className="text-xs text-muted-foreground">Selected: {bgImageFile.name}</p>}
                    </div>
                    {bgImageError && (
                        <p className="text-sm text-destructive flex items-center">
                            <AlertCircle className="mr-1 h-4 w-4" /> {bgImageError}
                        </p>
                    )}
                    <Button 
                        type="button" 
                        onClick={handleBgImageUpload} 
                        disabled={!bgImageFile || isUploadingBg}
                        variant="outline"
                        size="sm"
                    >
                        {isUploadingBg ? <Spinner className="mr-2" size={16}/> : <UploadCloud className="mr-2 h-4 w-4" />}
                        {isUploadingBg ? "Uploading..." : "Upload Background"}
                    </Button>
                    {currentBackgroundImageUrl && (
                        <div className="mt-3 pt-3 border-t">
                            <Label className="text-sm font-medium block mb-1">Current Background:</Label>
                            <div className="w-full aspect-video rounded border overflow-hidden relative bg-slate-200 dark:bg-slate-700">
                                <Image 
                                  src={currentBackgroundImageUrl} 
                                  alt="Background preview" 
                                  layout="fill" 
                                  objectFit="cover" 
                                  className="rounded"
                                  unoptimized={currentBackgroundImageUrl.startsWith('https://i.ibb.co')} // Avoid Next.js optimization for external ImgBB URLs if issues arise
                                />
                            </div>
                             <Button 
                                type="button" 
                                variant="link" 
                                size="sm" 
                                className="text-xs text-destructive p-0 h-auto mt-1 flex items-center"
                                onClick={removeBackgroundImage}
                              >
                                <XCircle className="mr-1 h-3 w-3"/> Remove Background Image
                              </Button>
                        </div>
                    )}
                     <FormField
                        control={form.control}
                        name="backgroundImageUrl"
                        render={({ field }) => (
                          <FormItem className="hidden">
                            <FormControl>
                              <Input {...field} type="url" value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                </CardContent>
              </Card>


              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Questions</h3>
                {questions.map((question, index) => (
                  <Card key={question.id || `question-${index}`} className="p-4 space-y-4 bg-card shadow-md relative">
                     <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 text-muted-foreground hover:text-destructive z-10"
                        onClick={() => removeQuestion(index)}
                        aria-label="Remove Question"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    <FormField
                      control={form.control}
                      name={`questions.${index}.text`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Question Text</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Enter your question here" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`questions.${index}.type`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Question Type</FormLabel>
                            <Select 
                                onValueChange={(value) => {
                                    field.onChange(value);
                                    if (value !== 'multiple-choice' && value !== 'checkbox') {
                                        form.setValue(`questions.${index}.options`, []);
                                    }
                                }} 
                                defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select question type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="text">Short Text</SelectItem>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="number">Number</SelectItem>
                                <SelectItem value="textarea">Long Text (Textarea)</SelectItem>
                                <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                                <SelectItem value="checkbox">Checkboxes</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                       <FormField
                          control={form.control}
                          name={`questions.${index}.isRequired`}
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 md:mt-7 bg-background">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  id={`required-${index}`}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel htmlFor={`required-${index}`}>
                                  Required
                                </FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />
                    </div>

                    {(form.watch(`questions.${index}.type`) === "multiple-choice" ||
                      form.watch(`questions.${index}.type`) === "checkbox") && (
                      <QuestionOptionsArray questionIndex={index} control={form.control} />
                    )}
                  </Card>
                ))}
                 {form.formState.errors.questions && typeof form.formState.errors.questions === 'object' && !Array.isArray(form.formState.errors.questions) && (
                    <p className="text-sm font-medium text-destructive flex items-center">
                        <AlertCircle className="mr-1 h-4 w-4" />
                        {form.formState.errors.questions.message}
                    </p>
                 )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => appendQuestion({ text: "", type: "text", options: [], isRequired: false })}
                  className="mt-2"
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Question
                </Button>
              </div>

              <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting || isUploadingBg}>
                {isSubmitting && <Spinner className="mr-2" size={16} />}
                Save Form
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </AppLayout>
  );
}

function QuestionOptionsArray({ questionIndex, control }: { questionIndex: number; control: any }) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `questions.${questionIndex}.options`,
  });

  return (
    <div className="space-y-3 pl-4 border-l-2 border-primary/50">
      <Label className="text-sm font-medium">Options</Label>
      {fields.map((option, optionIndex) => (
        <div key={option.id || `option-${questionIndex}-${optionIndex}`} className="flex items-center space-x-2">
          <FormField
            control={control}
            name={`questions.${questionIndex}.options.${optionIndex}.value`}
            render={({ field }) => (
              <FormItem className="flex-grow">
                <FormControl>
                  <Input placeholder={`Option ${optionIndex + 1}`} {...field} value={field.value || ""} />
                </FormControl>
                 <FormMessage />
              </FormItem>
            )}
          />
          <Button type="button" variant="ghost" size="icon" onClick={() => remove(optionIndex)} className="text-muted-foreground hover:text-destructive" aria-label="Remove Option">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
       {fields.length === 0 && <p className="text-xs text-muted-foreground">No options added yet for this question.</p>}
      <Button
        type="button"
        variant="link"
        size="sm"
        onClick={() => append({ value: "" })}
        className="text-primary"
      >
        <PlusCircle className="mr-1 h-4 w-4" /> Add Option
      </Button>
    </div>
  );
}

