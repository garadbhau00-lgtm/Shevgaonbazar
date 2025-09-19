'use server';
/**
 * @fileOverview This file defines a Genkit flow for suggesting improvements to ad descriptions.
 *
 * - suggestAdDescription - An async function that takes an ad description as input and returns an improved version.
 * - SuggestAdDescriptionInput - The input type for the suggestAdDescription function.
 * - SuggestAdDescriptionOutput - The return type for the suggestAdDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestAdDescriptionInputSchema = z.object({
  description: z
    .string()
    .describe('The ad description to be improved.  Should not be too short.'),
});
export type SuggestAdDescriptionInput = z.infer<typeof SuggestAdDescriptionInputSchema>;

const SuggestAdDescriptionOutputSchema = z.object({
  improvedDescription: z
    .string()
    .describe('The improved ad description with more details.'),
});
export type SuggestAdDescriptionOutput = z.infer<typeof SuggestAdDescriptionOutputSchema>;

export async function suggestAdDescription(input: SuggestAdDescriptionInput): Promise<SuggestAdDescriptionOutput> {
  return suggestAdDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestAdDescriptionPrompt',
  input: {schema: SuggestAdDescriptionInputSchema},
  output: {schema: SuggestAdDescriptionOutputSchema},
  prompt: `You are an expert in writing compelling ad descriptions for farmers selling livestock, farm produce, and equipment.

  Your goal is to improve the provided ad description to make it more appealing and informative for potential buyers.
  Ensure the description includes important details such as guarantees, condition, and any other relevant information that a buyer would need to know.

  Original Description: {{{description}}}

  Improved Description:`,
});

const suggestAdDescriptionFlow = ai.defineFlow(
  {
    name: 'suggestAdDescriptionFlow',
    inputSchema: SuggestAdDescriptionInputSchema,
    outputSchema: SuggestAdDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return {improvedDescription: output!.improvedDescription!};
  }
);
