import type { components, operations } from './openapi.js';

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export interface JsonObject {
  [key: string]: JsonValue;
}

export type Project = components['schemas']['Project'];
export type ProjectCreateAccepted = components['schemas']['ProjectCreateAccepted'];
export type Collection = components['schemas']['Collection'];
export type Source = components['schemas']['Source'];
export type AssetType = components['schemas']['AssetType'];
export type AssetTypeDefinition = components['schemas']['AssetTypeDefinition'];
export type Model = components['schemas']['Model'];
export type Voice = components['schemas']['Voice'];
export type Avatar = components['schemas']['Avatar'];
export type Generation = components['schemas']['Generation'];
export type GenerationPreview = components['schemas']['GenerationPreview'];
export type GenerationEditPreview = components['schemas']['GenerationEditPreview'];
export type Asset = components['schemas']['Asset'];
export type AssetFeedback = components['schemas']['AssetFeedback'];
export type ContentLoop = components['schemas']['ContentLoop'];
export type ContentLoopRun = components['schemas']['ContentLoopRun'];
export type ContentLoopRunFeedback = components['schemas']['ContentLoopRunFeedback'];
export type Account = components['schemas']['Account'];
export type ApiKey = components['schemas']['ApiKey'];
export type BillingUsage = components['schemas']['BillingUsage'];
export type PrepaymentSession = components['schemas']['PrepaymentSession'];
export type Webhook = components['schemas']['Webhook'];
export type WebhookEvent = components['schemas']['WebhookEvent'];
export type QuizV1 = components['schemas']['QuizV1'];
export type LeadMagnetProvenanceV1 = components['schemas']['LeadMagnetProvenanceV1'];

export type GenerationStatus = Generation['status'];
export type AssetStatus = Asset['status'];
export type ProjectStatus = Project['status'];

export interface PageOptions {
  cursor?: string;
  limit?: number;
}

export interface Page<T> {
  data: T[];
  next_cursor: string | null;
}

export interface CatalogPage<T> extends Page<T> {
  catalog_version: string;
}

export interface ProjectListOptions extends PageOptions {
  status?: ProjectStatus;
}

export interface SourceListOptions extends PageOptions {
  collection_id?: string;
  query?: string;
}

export interface ModelListOptions extends PageOptions {
  asset_type: string;
}

export interface VoiceListOptions extends PageOptions {
  project_id: string;
  asset_type?: string;
  model?: string;
  language?: string;
  kind?: 'stock' | 'custom';
  status?: 'processing' | 'ready' | 'failed' | 'revoked';
}

export type AvatarListOptions = VoiceListOptions;

export interface GenerationListOptions extends PageOptions {
  project_id?: string;
  edited_from_generation_id?: string;
  status?: GenerationStatus;
}

export interface AssetListOptions extends PageOptions {
  project_id?: string;
  asset_type?: string;
  origin?: 'one_off' | 'content_loop';
  status?: AssetStatus;
  created_at_from?: string;
  created_at_before?: string;
  input_type?: 'trend' | 'topic' | 'knowledge';
  subject_query?: string;
}

export interface ContentLoopListOptions extends PageOptions {
  project_id?: string;
  status?: 'active' | 'paused' | 'archived';
}

export type ContentLoopRunListOptions = PageOptions;

export interface RequestOptions {
  requestTimeoutMs?: number;
  signal?: AbortSignal;
}

export interface MutationOptions extends RequestOptions {
  idempotencyKey?: string;
}

export interface WaitOptions extends RequestOptions {
  timeoutMs?: number;
}

export type ProjectCreateInput = operations['createProject']['requestBody']['content']['application/json'];
export type ProjectUpdateInput = operations['updateProject']['requestBody']['content']['application/json'];
export type CollectionCreateInput = operations['createCollection']['requestBody']['content']['application/json'];
export type CollectionUpdateInput = operations['updateCollection']['requestBody']['content']['application/json'];
export type AssetFeedbackInput = operations['recordAssetFeedback']['requestBody']['content']['application/json'];
export type ContentLoopCreateInput = operations['createContentLoop']['requestBody']['content']['application/json'];
export type ContentLoopUpdateInput = operations['updateContentLoop']['requestBody']['content']['application/json'];
export type ContentLoopRunInput = operations['runContentLoop']['requestBody']['content']['application/json'];
export type ContentLoopRunFeedbackInput = operations['recordContentLoopRunFeedback']['requestBody']['content']['application/json'];
export type ApiKeyCreateInput = operations['createApiKey']['requestBody']['content']['application/json'];
export type ApiKeyRevocation = components['schemas']['ApiKeyRevocation'];
export type PrepaymentSessionCreateInput = operations['createPrepaymentSession']['requestBody']['content']['application/json'];
export type WebhookCreateInput = operations['createWebhook']['requestBody']['content']['application/json'];
export type GenerationEditDraft = operations['previewGenerationEdit']['requestBody']['content']['application/json'];
export type GenerationEditRequest = operations['createGenerationEdit']['requestBody']['content']['application/json'];

export type UploadStream = ReadableStream<Uint8Array> | AsyncIterable<Uint8Array | string>;
export type UploadData = Blob | UploadStream;
export type UploadFactory = () => UploadData | Promise<UploadData>;
export type UploadSource = UploadData | UploadFactory;

export interface FileUpload {
  file: UploadSource;
  filename?: string;
  content_type?: string;
}

export type SourceCreateInput =
  | operations['createSource']['requestBody']['content']['application/json']
  | (FileUpload & { collection_id?: string; title?: string });

export type LogoInput =
  | FileUpload
  | operations['replaceProjectLogo']['requestBody']['content']['application/json'];

export type VoiceCreateInput =
  | (FileUpload & {
      display_name: string;
      consent_attested: true;
      ownership_attested: true;
    })
  | operations['createVoice']['requestBody']['content']['application/json'];

export type AvatarCreateInput =
  | (FileUpload & {
      display_name: string;
      consent_attested: true;
      ownership_attested: true;
    })
  | operations['createAvatar']['requestBody']['content']['application/json'];

export type LeadMagnetFormat =
  | 'checklist'
  | 'cheat_sheet'
  | 'workbook'
  | 'planner'
  | 'tracker'
  | 'scorecard'
  | 'roadmap'
  | 'challenge'
  | 'swipe_file'
  | 'resource_guide'
  | 'comparison_guide'
  | 'meal_plan';

export type GenerationInput =
  | { type: 'trend'; lookback_days?: number; instructions?: string }
  | {
      type: 'topic';
      topic: string;
      evidence_scope?: 'project' | 'project_and_web';
      lookback_days?: number;
      source_ids?: string[];
      collection_ids?: string[];
      instructions?: string;
    }
  | {
      type: 'knowledge';
      source_ids?: string[];
      collection_ids?: string[];
      instructions?: string;
    };

interface AssetRequestBase<TAssetType extends string, TOptions extends JsonObject> {
  asset_type: TAssetType;
  instructions?: string;
  language?: string;
  options?: TOptions;
  model?: string;
  model_options?: JsonObject;
}

export type ArticleRequest = AssetRequestBase<'article', { target_words?: number }>;
export type LeadMagnetRequest = AssetRequestBase<
  'lead_magnet',
  { page_count?: number; format?: 'auto' | LeadMagnetFormat }
>;
export type EbookRequest = AssetRequestBase<'ebook', { chapter_count?: number; target_pages?: number }>;
export type SlidesRequest = AssetRequestBase<'slides', { slide_count?: number; aspect_ratio?: '16:9' | '4:3' }>;
export type InfographicRequest = AssetRequestBase<
  'infographic',
  { aspect_ratio?: '1:1' | '4:5' | '9:16' | '16:9'; resolution?: 'standard' | 'high' }
>;
export type QuizRequest = AssetRequestBase<
  'quiz',
  { question_count?: number; difficulty?: 'beginner' | 'intermediate' | 'advanced' }
>;
export type PodcastEpisodeRequest = AssetRequestBase<'podcast_episode', { duration_seconds?: number }> & {
  voice_id?: string;
};

export interface VideoOptions extends JsonObject {
  duration_seconds?: number;
  aspect_ratio?: '16:9' | '9:16' | '1:1';
  resolution?: '720p' | '1080p';
  captions?: boolean;
  presentation_mode?: 'faceless' | 'avatar';
}

type VideoRequest<TAssetType extends string, TOptions extends VideoOptions = VideoOptions> =
  AssetRequestBase<TAssetType, TOptions> & {
    voice_id?: string;
    avatar_id?: string;
  };

export type ShortVideoRequest = VideoRequest<'short_video'>;
export type ExplainerVideoRequest = VideoRequest<'explainer_video'>;
export type LaunchVideoRequest = VideoRequest<'launch_video'>;
export type ProductDemoVideoRequest = VideoRequest<
  'product_demo_video',
  VideoOptions & { product_visual_source_ids?: string[] }
>;
export type AdVideoRequest = VideoRequest<'ad_video'>;

export type KnownAssetRequest =
  | ArticleRequest
  | LeadMagnetRequest
  | EbookRequest
  | SlidesRequest
  | InfographicRequest
  | QuizRequest
  | PodcastEpisodeRequest
  | ShortVideoRequest
  | ExplainerVideoRequest
  | LaunchVideoRequest
  | ProductDemoVideoRequest
  | AdVideoRequest;

declare const extensionAssetTypeBrand: unique symbol;
export type ExtensionAssetType = string & { readonly [extensionAssetTypeBrand]: true };

export interface ExtensionAssetRequest {
  asset_type: ExtensionAssetType;
  instructions?: string;
  language?: string;
  options?: JsonObject;
  voice_id?: string;
  avatar_id?: string;
  model?: string;
  model_options?: JsonObject;
}

export type AssetRequest = KnownAssetRequest | ExtensionAssetRequest;

export interface GenerationDraft {
  project_id: string;
  input: GenerationInput;
  instructions?: string;
  language?: string;
  assets: AssetRequest[];
  metadata?: JsonObject;
}

export interface GenerationCreateRequest extends GenerationDraft {
  max_cost_usd: string;
}

const knownAssetTypes = new Set([
  'article',
  'lead_magnet',
  'ebook',
  'slides',
  'infographic',
  'quiz',
  'podcast_episode',
  'short_video',
  'explainer_video',
  'launch_video',
  'product_demo_video',
  'ad_video'
]);

export const extensionAsset = (
  assetType: string,
  fields: Omit<ExtensionAssetRequest, 'asset_type'> = {}
): ExtensionAssetRequest => {
  const normalized = assetType.trim();
  if (normalized.length === 0 || knownAssetTypes.has(normalized)) {
    throw new TypeError('extensionAsset requires a non-empty Asset type not built into this SDK version.');
  }
  return { ...fields, asset_type: normalized as ExtensionAssetType };
};

export type { components, operations } from './openapi.js';
