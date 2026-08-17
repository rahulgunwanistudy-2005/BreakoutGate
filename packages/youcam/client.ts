/**
 * @file packages/youcam/client.ts
 * @description Unified server-side Perfect Corp / YouCam provider client.
 */

import { loadYouCamConfig, OptionalYouCamConfig, sanitizeConfig, YouCamConfig } from "./config";
import { runMakeupVto, createMakeupVtoTask, checkMakeupVtoTaskStatus } from "./makeup-vto";
import { runSkinAnalysis, createSkinAnalysisTask, checkSkinAnalysisTaskStatus } from "./skin-analysis";
import { ProviderTrace } from "./trace";
import {
  FileUploadResult,
  ImageInput,
  MakeupVtoPollResult,
  MakeupVtoTaskInitiation,
  MakeupVtoTaskParams,
  PollingOptions,
  SkinAnalysisPollResult,
  SkinAnalysisTaskInitiation,
  SkinAnalysisTaskParams,
} from "./types";
import { uploadImageToYouCam } from "./upload";

export class YouCamClient {
  private readonly config: YouCamConfig;

  constructor(options?: OptionalYouCamConfig) {
    this.config = loadYouCamConfig(options);
  }

  /**
   * Uploads an image (buffer or URL) to YouCam File API.
   */
  public async uploadImage(
    input: ImageInput,
    signal?: AbortSignal
  ): Promise<{ result: FileUploadResult; trace: ProviderTrace }> {
    return uploadImageToYouCam(this.config, input, signal);
  }

  /**
   * Initiates an asynchronous Skin Analysis task.
   */
  public async createSkinAnalysis(
    params: SkinAnalysisTaskParams
  ): Promise<{ initiation: SkinAnalysisTaskInitiation; trace: ProviderTrace }> {
    return createSkinAnalysisTask(this.config, params);
  }

  /**
   * Checks status of an in-flight Skin Analysis task.
   */
  public async pollSkinAnalysis(
    taskId: string,
    signal?: AbortSignal
  ) {
    return checkSkinAnalysisTaskStatus(this.config, taskId, signal);
  }

  /**
   * Runs the complete Skin Analysis workflow with bounded polling.
   */
  public async runSkinAnalysis(
    params: SkinAnalysisTaskParams,
    options?: PollingOptions
  ): Promise<{ result: SkinAnalysisPollResult; traces: ProviderTrace[] }> {
    return runSkinAnalysis(this.config, params, options);
  }

  /**
   * Initiates an asynchronous Makeup VTO task.
   */
  public async createMakeupVto(
    params: MakeupVtoTaskParams
  ): Promise<{ initiation: MakeupVtoTaskInitiation; trace: ProviderTrace }> {
    return createMakeupVtoTask(this.config, params);
  }

  /**
   * Checks status of an in-flight Makeup VTO task.
   */
  public async pollMakeupVto(
    taskId: string,
    signal?: AbortSignal
  ) {
    return checkMakeupVtoTaskStatus(this.config, taskId, signal);
  }

  /**
   * Runs the complete Makeup VTO workflow with bounded polling.
   */
  public async runMakeupVto(
    params: MakeupVtoTaskParams,
    options?: PollingOptions
  ): Promise<{ result: MakeupVtoPollResult; traces: ProviderTrace[] }> {
    return runMakeupVto(this.config, params, options);
  }

  /**
   * Returns safe sanitized configuration metadata (no secrets).
   */
  public getConfigSanitized(): Record<string, unknown> {
    return sanitizeConfig(this.config);
  }
}
