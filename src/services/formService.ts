'use server';
/**
 * @fileOverview Service functions for form interactions with Firestore.
 *
 * - saveForm(userId, formData) - Saves a new form to Firestore.
 * - getForm(formId) - Retrieves a form by its ID from Firestore.
 */

import { db } from '@/lib/firebase';
import { collection, addDoc, doc, getDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { Question } from '@/app/forms/create/page'; // Assuming Question type is exported

export interface FormSchemaForFirestore {
  userId: string;
  title: string;
  questions: Question[];
  createdAt: Timestamp;
  publishedLinkPath?: string;
}

export async function saveForm(userId: string, formData: { title: string; questions: Question[] }): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'forms'), {
      userId,
      title: formData.title,
      questions: formData.questions,
      createdAt: serverTimestamp(),
    });
    console.log('Form saved with ID: ', docRef.id);
    // Optionally, update the document with its own ID or a public link path
    // await updateDoc(docRef, { publishedLinkPath: `/form/${docRef.id}` });
    return docRef.id;
  } catch (error) {
    console.error('Error saving form: ', error);
    throw new Error('Failed to save form.');
  }
}

export async function getForm(formId: string): Promise<FormSchemaForFirestore | null> {
  try {
    const formDocRef = doc(db, 'forms', formId);
    const formDocSnap = await getDoc(formDocRef);

    if (formDocSnap.exists()) {
      return formDocSnap.data() as FormSchemaForFirestore;
    } else {
      console.log('No such document!');
      return null;
    }
  } catch (error) {
    console.error('Error fetching form: ', error);
    throw new Error('Failed to fetch form.');
  }
}
