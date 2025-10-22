
import { z } from 'zod';

export const AiCropDoctorOutputSchema = z.object({
  diagnosis: z.string().describe('The diagnosis of the crop disease in Bangla.'),
  solutions: z.array(z.string()).describe('A list of at least 3 potential solutions to the crop disease in Bangla.'),
});

export type AiCropDoctorOutput = z.infer<typeof AiCropDoctorOutputSchema>;
