
'use server';
/**
 * @fileOverview Service functions for form interactions with Firestore.
 *
 * - saveForm(userId, formData) - Saves a new form to Firestore.
 * - getForm(formId) - Retrieves a form by its ID from Firestore.
 * - getFormsByUser(userId) - Retrieves all forms for a given user.
 * - deleteForm(formId, userId) - Deletes a form if the user is the owner.
 * - updateForm(formId, userId, formData) - Updates an existing form.
 */

import { db } from '@/lib/firebase';
import { collection, addDoc, doc, getDoc, getDocs, query, where, serverTimestamp, Timestamp, deleteDoc, updateDoc, orderBy } from 'firebase/firestore';
import type { Question } from '@/app/forms/create/page';

// Interface for data going to/coming from Firestore
export interface FormSchemaForFirestore {
  id?: string; // Firestore document ID, added after retrieval
  userId: string;
  title: string;
  questions: Question[];
  createdAt: Timestamp; // Always Timestamp when dealing with Firestore directly
  publishedLinkPath?: string;
}

// Interface for form data when used in components, createdAt might be string
export interface FormSchemaWithId extends FormSchemaForFirestore {
  id: string;
  createdAt: Timestamp | string; // Allow string for display purposes after conversion
}


export async function saveForm(userId: string, formData: { title: string; questions: Question[] }): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'forms'), {
      userId,
      title: formData.title,
      questions: formData.questions.map(q => ({
        ...q,
        id: q.id || crypto.randomUUID(),
        options: q.options?.map(opt => ({ ...opt, id: opt.id || crypto.randomUUID() }))
      })),
      createdAt: serverTimestamp(),
    });
    console.log('Form saved with ID: ', docRef.id);
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
      // Explicitly cast to FormSchemaForFirestore, assuming data structure matches
      return { id: formDocSnap.id, ...formDocSnap.data() } as FormSchemaForFirestore;
    } else {
      console.log('No such document!');
      return null;
    }
  } catch (error) {
    console.error('Error fetching form: ', error);
    throw new Error('Failed to fetch form.');
  }
}

export async function getFormsByUser(userId: string): Promise<FormSchemaWithId[]> {
  try {
    const formsCollectionRef = collection(db, 'forms');
    const q = query(formsCollectionRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const forms: FormSchemaWithId[] = [];
    querySnapshot.forEach((doc) => {
      forms.push({ id: doc.id, ...doc.data() } as FormSchemaWithId);
    });
    return forms;
  } catch (error) {
    console.error('Error fetching forms by user: ', error);
    throw new Error('Failed to fetch forms.');
  }
}

export async function deleteForm(formId: string, userId: string): Promise<void> {
  try {
    const formDocRef = doc(db, 'forms', formId);
    const formDocSnap = await getDoc(formDocRef);

    if (!formDocSnap.exists()) {
      throw new Error('Form not found.');
    }

    const formData = formDocSnap.data() as FormSchemaForFirestore;
    if (formData.userId !== userId) {
      throw new Error('User not authorized to delete this form.');
    }

    await deleteDoc(formDocRef);
    console.log('Form deleted successfully: ', formId);
  } catch (error) {
    console.error('Error deleting form: ', error);
    // Re-throw the original error if it's one of our specific messages, or a generic one
    if (error instanceof Error && (error.message === 'Form not found.' || error.message === 'User not authorized to delete this form.')) {
      throw error;
    }
    throw new Error('Failed to delete form.');
  }
}

export async function updateForm(formId: string, userId: string, formData: { title: string; questions: Question[] }): Promise<void> {
  try {
    const formDocRef = doc(db, 'forms', formId);
    const formDocSnap = await getDoc(formDocRef);

    if (!formDocSnap.exists()) {
      throw new Error('Form not found.');
    }

    const existingFormData = formDocSnap.data() as FormSchemaForFirestore;
    if (existingFormData.userId !== userId) {
      throw new Error('User not authorized to update this form.');
    }

    await updateDoc(formDocRef, {
      title: formData.title,
      questions: formData.questions.map(q => ({
        ...q,
        id: q.id || crypto.randomUUID(),
        options: q.options?.map(opt => ({ ...opt, id: opt.id || crypto.randomUUID() }))
      })),
      // userId and createdAt should not be updated here
    });
    console.log('Form updated successfully: ', formId);
  } catch (error) {
    console.error('Error updating form: ', error);
     if (error instanceof Error && (error.message === 'Form not found.' || error.message === 'User not authorized to update this form.')) {
      throw error;
    }
    throw new Error('Failed to update form.');
  }
}
