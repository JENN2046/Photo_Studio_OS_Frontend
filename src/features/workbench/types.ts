export interface Entity { id: string; createdAt?: string }
export interface Project extends Entity { name: string }
export interface Asset extends Entity { originalFilename?: string; status?: string }
export interface Sku extends Entity { name: string; code: string }
export interface Page<T> { items: T[]; limit: number; total: number; hasMore?: boolean; nextCursor?: string | null }
export interface SpecField { value: unknown; provenance: string; mutability: "locked" | "editable" }
export interface Reference { assetId: string; role: string; provenance: string; mutability: "locked" | "editable" }
export interface SpecVersion extends Entity { specId: string; versionNumber: number; fields: Record<string, SpecField>; references: Reference[]; reason: string }
export interface Unit extends Entity { name: string; creativeSpec: { id: string; currentVersion: number } | null; subjects: Array<{kind: string; skuId?: string; subjectKey?: string; role: string}> }
export interface Deliverable extends Entity { name: string; intent?: string; productionUnits: Unit[] }
export interface Production { projectId: string; deliverables: Deliverable[] }
export interface Recipe extends Entity { creativeSpecVersionId: string; compilerVersion: string; outputDigest: string; sourceRecipeId?: string; prompt?: string; negativePrompt?: string }
export interface Scratchpad extends Entity { title: string; status: string }
export interface ExplorationAttempt extends Entity { scratchpadId: string; recipeId: string; kind: string; status: string }
export interface Review extends Entity { decision: string; candidateRevision: number; reviewedContentSha256: string; reason?: string }
export interface Promotion extends Entity { assetId: string; candidateId: string; idempotencyKey?: string; contentSha256?: string }
export interface Candidate extends Entity { attemptId: string; contentSha256: string; mimeType: string; byteSize: number; width: number; height: number; status: string; revision: number; reviews?: Review[]; promotionReceipt?: Promotion | null }
export interface Evaluation extends Entity { recipeId: string; assetId: string; decision: string; scores?: Record<string, number>; failureFindings?: unknown; policyVersion?: string }
export interface LocalRecipe extends Entity { recipeId: string; sourceCandidateId: string; targetScratchpadId: string; width: number; height: number; inputSnapshotDigest: string; capabilityId: string; capabilityDigest?: string }
export interface Grant extends Entity { recipeId: string; localMediaRecipeId?: string | null; capabilityId: string; costUnit?: string; startsAt: string; expiresAt: string; maxAttempts: number; maxAttemptCredits: number; maxTotalCredits: number | string; reservedCredits?: string; consumedCredits?: string; revokedAt?: string | null; entries?: BudgetEntry[]; entryPage?: {limit: number; total: number; hasMore: boolean; nextCursor?: string | null} }
export interface BudgetEntry extends Entity { phase: string; reservationCredits: string; consumedCredits: string; releasedCredits: string; attemptId?: string }
export interface ExecutionAttempt extends Entity { sequence: number; submissionState: string; executionState: string; revision: number; fence: number; reservationCredits: number; actualCredits?: string | null; settledAt?: string | null; leaseExpiresAt?: string | null; capabilityId: string }
export interface Operation extends Entity { grantId: string; state: string; quarantined?: boolean; effectiveState?: string; effectiveQuarantined?: boolean; reconciliationDue?: boolean; attempts?: ExecutionAttempt[]; events?: ExecutionEvent[]; eventPage?: {limit: number; total: number; hasMore: boolean} }
export interface ExecutionEvent extends Entity { kind?: string; eventType?: string; outcome?: string; evidenceKind?: string; eventKey?: string }
export interface MediaResult extends Entity { executionAttemptId: string; candidateId: string; candidate?: Candidate; contentSha256?: string }
export interface LocalControl { mode: string; revision: number; pool: {busy: boolean; phase: string; poolEpoch?: number; attemptId?: string; projectId?: string; leaseExpiresAt?: string | null; stopRequested?: boolean} }
export interface CollectionTypes { recipes: Recipe; evaluations: Evaluation; scratchpads: Scratchpad; explorationAttempts: ExplorationAttempt; candidates: Candidate; grants: Grant; operations: Operation; localMediaRecipes: LocalRecipe; mediaResults: MediaResult }
export type CollectionName = keyof CollectionTypes;
export type Collections = { [K in CollectionName]?: Page<CollectionTypes[K]> };
export interface WorkbenchSnapshot { schemaVersion: "creative_workbench.v1"; projectId: string; productionUnitId: string; collections: Collections }
export type RunAction = (label: string, action: () => Promise<void>, safeControlMode?: string) => Promise<boolean>;
