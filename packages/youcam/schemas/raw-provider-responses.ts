/**
 * @file packages/youcam/schemas/raw-provider-responses.ts
 * @description Zod runtime schemas for raw Perfect Corp / YouCam API responses.
 *
 * Used at the provider boundary to validate incoming HTTP payloads before normalization.
 */

import { z } from "zod";

const RawFileRequestSchema = z.object({
  url: z.string().url().optional(),
  method: z.string().optional(),
  headers: z.record(z.string()).optional(),
});

const RawFileItemSchema = z.object({
  file_id: z.string().optional(),
  content_type: z.string().optional(),
  file_name: z.string().optional(),
  requests: z.union([RawFileRequestSchema, z.array(RawFileRequestSchema)]).optional(),
});

export const RawFileUploadResponseSchema = z.object({
  status: z.number().optional(),
  data: z
    .object({
      files: z.array(RawFileItemSchema).optional(),
    })
    .optional(),
  result: z
    .object({
      file_id: z.string().optional(),
      files: z.array(RawFileItemSchema).optional(),
      requests: z.union([RawFileRequestSchema, z.array(RawFileRequestSchema)]).optional(),
    })
    .optional(),
  file_id: z.string().optional(),
  files: z.array(RawFileItemSchema).optional(),
});
export type RawFileUploadResponse = z.infer<typeof RawFileUploadResponseSchema>;

export const RawSkinAnalysisTaskInitiationSchema = z.object({
  status: z.number().optional(),
  result: z
    .object({
      task_id: z.string().optional(),
    })
    .optional(),
  task_id: z.string().optional(),
});
export type RawSkinAnalysisTaskInitiation = z.infer<typeof RawSkinAnalysisTaskInitiationSchema>;

export const RawSkinMetricItemSchema = z.object({
  score: z.number().optional(),
  level: z.number().optional(),
  category: z.string().optional(),
  raw_value: z.number().optional(),
});
export type RawSkinMetricItem = z.infer<typeof RawSkinMetricItemSchema>;

export const RawSkinAnalysisPollResponseSchema = z
  .object({
    status: z.number().optional(),
    result: z
      .object({
        task_status: z.string().optional(),
        task_id: z.string().optional(),
        output: z
          .object({
            skin_analysis: z.record(RawSkinMetricItemSchema).optional(),
            face_info: z
              .object({
                box: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(),
                confidence: z.number().optional(),
              })
              .optional(),
            quality_score: z.number().optional(),
          })
          .optional(),
        error: z
          .object({
            code: z.string().optional(),
            message: z.string().optional(),
          })
          .optional(),
      })
      .optional(),
    task_status: z.string().optional(),
    output: z
      .object({
        skin_analysis: z.record(RawSkinMetricItemSchema).optional(),
        face_info: z
          .object({
            box: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(),
            confidence: z.number().optional(),
          })
          .optional(),
        quality_score: z.number().optional(),
      })
      .optional(),
  })
  .refine(
    (data) => Boolean(data.result || data.output || data.task_status),
    {
      message: "Raw Skin Analysis response must contain at least result, output, or task_status.",
    }
  );
export type RawSkinAnalysisPollResponse = z.infer<typeof RawSkinAnalysisPollResponseSchema>;

export const RawMakeupVtoTaskInitiationSchema = z.object({
  status: z.number().optional(),
  result: z
    .object({
      task_id: z.string().optional(),
    })
    .optional(),
  task_id: z.string().optional(),
});
export type RawMakeupVtoTaskInitiation = z.infer<typeof RawMakeupVtoTaskInitiationSchema>;

export const RawMakeupVtoPollResponseSchema = z.object({
  status: z.number().optional(),
  result: z
    .object({
      task_status: z.string().optional(),
      task_id: z.string().optional(),
      output: z
        .object({
          artifact_url: z.string().url().optional(),
          image_url: z.string().url().optional(),
          width: z.number().optional(),
          height: z.number().optional(),
        })
        .optional(),
      error: z
        .object({
          code: z.string().optional(),
          message: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
  task_status: z.string().optional(),
  output: z
    .object({
      artifact_url: z.string().url().optional(),
      image_url: z.string().url().optional(),
      width: z.number().optional(),
      height: z.number().optional(),
    })
    .optional(),
});
export type RawMakeupVtoPollResponse = z.infer<typeof RawMakeupVtoPollResponseSchema>;
