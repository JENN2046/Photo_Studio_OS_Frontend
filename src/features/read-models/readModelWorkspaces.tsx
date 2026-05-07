import { useMemo, useState } from "react";
import type {
  BackendAssetInbox,
  BackendDeliveryReadiness,
  BackendQcRetouchQueue,
  BackendReviewGallery
} from "../../api/backendReadModels";
import {
  assetShotLabel,
  assetSkuLabel,
  assetTone,
  createDeliveryArtifacts,
  deliveryChecklistLabels,
  formatBytes,
  formatDimensions,
  formatPercent,
  formatQcResultKey,
  formatQcResultValue,
  formatReason,
  formatShortDateTime,
  formatSource,
  formatStatus,
  qcItemTone,
  reviewItemTone,
  toneFromStatus,
  type ReadModelViewModel
} from "./readModelViewModels";

type DeliveryChecklistKey = keyof BackendDeliveryReadiness["checklist"];

function ReadOnlyActionPair({
  ariaLabel,
  className,
  labels
}: {
  ariaLabel?: string;
  className: string;
  labels: [string, string];
}) {
  return (
    <div className={className} aria-label={ariaLabel}>
      {labels.map((label) => (
        <button
          aria-disabled="true"
          disabled
          key={label}
          title={`${label}：当前阶段保持只读，不执行业务写入。`}
          type="button"
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function ReadModelMetricStrip({
  ariaLabel,
  className,
  metrics
}: {
  ariaLabel: string;
  className?: string;
  metrics: ReadModelViewModel["metrics"];
}) {
  const metricClassName = ["read-model-metrics", className]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={metricClassName} aria-label={ariaLabel}>
      {metrics.map((metric) => (
        <article
          className={`read-model-metric read-model-tone-${metric.tone}`}
          key={metric.label}
        >
          <span>{metric.label}</span>
          <strong>{metric.value}</strong>
          <small>{metric.detail}</small>
        </article>
      ))}
    </section>
  );
}

export function AssetInboxWorkspace({
  model,
  viewModel
}: {
  model: BackendAssetInbox;
  viewModel: ReadModelViewModel;
}) {
  const [selectedAssetId, setSelectedAssetId] = useState(
    model.selectedAssetId ?? model.items[0]?.assetId ?? ""
  );
  const selectedAsset = useMemo(
    () =>
      model.items.find((item) => item.assetId === selectedAssetId) ??
      model.items[0],
    [model.items, selectedAssetId]
  );
  const selectedTone = selectedAsset ? assetTone(selectedAsset) : "neutral";
  const boundCount = model.items.filter(
    (item) => item.binding.status === "bound"
  ).length;
  const qcRiskCount = model.items.filter((item) =>
    ["failed", "warning"].includes(item.latestQc?.status ?? "")
  ).length;

  return (
    <section className="asset-inbox-workspace">
      <ReadModelMetricStrip
        ariaLabel={`${viewModel.title} 指标面板`}
        className="asset-inbox-metrics"
        metrics={viewModel.metrics}
      />

      <section className="asset-inbox-console" aria-label="素材工作台">
        <header className="asset-inbox-intake">
          <div>
            <p className="eyebrow">Capture One Intake</p>
            <strong>{formatSource(model.intake.source)}</strong>
            <span>
              {formatStatus(model.intake.status)} /{" "}
              {formatReason(model.intake.message)}
            </span>
          </div>
          <div className="asset-inbox-intake-stats" aria-label="素材入库统计">
            <span>
              <b>{model.total}</b>
              素材
            </span>
            <span>
              <b>{boundCount}</b>
              已绑定
            </span>
            <span>
              <b>{qcRiskCount}</b>
              QC 风险
            </span>
          </div>
        </header>

        <div className="asset-inbox-body">
          <section className="asset-thumbnail-panel" aria-label="缩略图网格">
            <div className="asset-panel-head">
              <div>
                <p className="eyebrow">Asset Grid</p>
                <strong>{model.projectId}</strong>
              </div>
              <span>
                {model.items.length} / {model.limit}
              </span>
            </div>
            <div className="asset-thumbnail-grid">
              {model.items.map((asset) => {
                const tone = assetTone(asset);

                return (
                  <button
                    aria-pressed={asset.assetId === selectedAsset?.assetId}
                    className={`asset-thumbnail read-model-tone-${tone}`}
                    key={asset.assetId}
                    onClick={() => setSelectedAssetId(asset.assetId)}
                    type="button"
                  >
                    <span className="asset-thumbnail-visual" aria-hidden="true">
                      <b>{asset.file.fileExt ?? "RAW"}</b>
                    </span>
                    <span className="asset-thumbnail-copy">
                      <strong>
                        {asset.file.originalFilename ?? asset.assetId}
                      </strong>
                      <small>{assetSkuLabel(asset)}</small>
                      <small>{assetShotLabel(asset)}</small>
                    </span>
                    <i>{formatStatus(asset.latestQc?.status ?? asset.status)}</i>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="asset-preview-panel" aria-label="选中素材预览">
            {selectedAsset ? (
              <>
                <div
                  className={`asset-preview-visual read-model-tone-${selectedTone}`}
                >
                  <span>{selectedAsset.file.fileExt ?? "RAW"}</span>
                  <strong>{selectedAsset.assetId}</strong>
                  <small>{selectedAsset.file.originalFilename}</small>
                </div>
                <div className="asset-preview-copy">
                  <p className="eyebrow">Selected Asset</p>
                  <h2>
                    {selectedAsset.file.originalFilename ??
                      selectedAsset.assetId}
                  </h2>
                  <span>{assetSkuLabel(selectedAsset)}</span>
                  <span>{assetShotLabel(selectedAsset)}</span>
                </div>
                <ReadOnlyActionPair
                  ariaLabel="只读操作状态"
                  className="asset-preview-actions"
                  labels={["上传未启用", "下载未启用"]}
                />
              </>
            ) : (
              <p>暂无素材可预览。</p>
            )}
          </section>
        </div>
      </section>

      {selectedAsset ? (
        <section className="asset-inbox-detail-grid" aria-label="素材只读详情">
          <article
            className={`read-model-detail read-model-tone-${toneFromStatus(
              selectedAsset.binding.status
            )}`}
          >
            <span>绑定状态</span>
            <strong>{formatStatus(selectedAsset.binding.status)}</strong>
            <small>
              {formatReason(selectedAsset.binding.reason)} / 置信度{" "}
              {formatPercent(selectedAsset.binding.confidence)}
            </small>
          </article>
          <article className="read-model-detail read-model-tone-neutral">
            <span>文件信息</span>
            <strong>{formatDimensions(selectedAsset)}</strong>
            <small>
              {formatBytes(selectedAsset.file.fileSizeBytes)} /{" "}
              {selectedAsset.file.colorSpace ?? "色彩空间待定"}
            </small>
          </article>
          <article
            className={`read-model-detail read-model-tone-${toneFromStatus(
              selectedAsset.latestQc?.status
            )}`}
          >
            <span>QC Checklist</span>
            <strong>
              {formatStatus(selectedAsset.latestQc?.status ?? selectedAsset.status)}
            </strong>
            <small>
              {(selectedAsset.latestQc?.failedReasons ?? []).length > 0
                ? selectedAsset.latestQc?.failedReasons
                    ?.map((reason) => formatReason(reason))
                    .join(" / ")
                : selectedAsset.latestQc?.notes ?? "暂未发现质检风险"}
            </small>
          </article>
        </section>
      ) : null}
    </section>
  );
}

function QcResultList({ results }: { results: Record<string, unknown> }) {
  const entries = Object.entries(results);

  if (entries.length === 0) {
    return <p className="qc-empty-note">暂无检查结果。</p>;
  }

  return (
    <ul className="qc-result-list">
      {entries.map(([key, value]) => (
        <li key={key}>
          <span>{formatQcResultKey(key)}</span>
          <b>{formatQcResultValue(value)}</b>
        </li>
      ))}
    </ul>
  );
}

export function QcRetouchWorkspace({
  model,
  viewModel
}: {
  model: BackendQcRetouchQueue;
  viewModel: ReadModelViewModel;
}) {
  const [selectedAssetId, setSelectedAssetId] = useState(
    model.items[0]?.assetId ?? ""
  );
  const selectedItem = useMemo(
    () =>
      model.items.find((item) => item.assetId === selectedAssetId) ??
      model.items[0],
    [model.items, selectedAssetId]
  );
  const failedCount = model.items.filter(
    (item) => item.qc.latestStatus === "failed"
  ).length;
  const warningCount = model.items.filter(
    (item) => item.qc.latestStatus === "warning"
  ).length;
  const activeRetouchCount = model.items.filter(
    (item) => item.retouch && item.retouch.status !== "done"
  ).length;
  const selectedTone = selectedItem ? qcItemTone(selectedItem) : "neutral";
  const failedReasons = selectedItem?.qc.failedReasons ?? [];

  return (
    <section className="qc-retouch-workspace">
      <ReadModelMetricStrip
        ariaLabel={`${viewModel.title} 指标面板`}
        className="qc-retouch-metrics"
        metrics={viewModel.metrics}
      />

      <section className="qc-retouch-console" aria-label="QC 精修工作台">
        <header className="qc-retouch-summary">
          <div>
            <p className="eyebrow">QC Queue</p>
            <strong>{model.projectId}</strong>
            <span>只读队列 / 不执行退回、补拍或审批写入</span>
          </div>
          <div className="qc-retouch-summary-stats">
            <span>
              <b>{failedCount}</b>
              失败
            </span>
            <span>
              <b>{warningCount}</b>
              警告
            </span>
            <span>
              <b>{activeRetouchCount}</b>
              精修中
            </span>
          </div>
        </header>

        <div className="qc-retouch-body">
          <section className="qc-queue-panel" aria-label="QC 队列">
            <div className="asset-panel-head">
              <div>
                <p className="eyebrow">Retouch Queue</p>
                <strong>{model.items.length} 个素材版本</strong>
              </div>
              <span>
                {model.page} / {model.limit}
              </span>
            </div>
            <div className="qc-queue-list">
              {model.items.map((item) => {
                const tone = qcItemTone(item);

                return (
                  <button
                    aria-pressed={item.assetId === selectedItem?.assetId}
                    className={`qc-queue-card read-model-tone-${tone}`}
                    key={item.assetId}
                    onClick={() => setSelectedAssetId(item.assetId)}
                    type="button"
                  >
                    <span>
                      <b>{item.assetId}</b>
                      <i>{formatStatus(item.qc.latestStatus)}</i>
                    </span>
                    <strong>{assetSkuLabel(item)}</strong>
                    <small>{assetShotLabel(item)}</small>
                    <small>
                      {item.retouch?.assignedTo ?? "负责人待定"} /{" "}
                      {formatShortDateTime(item.retouch?.dueAt)}
                    </small>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="qc-selected-panel" aria-label="选中 QC 详情">
            {selectedItem ? (
              <>
                <div
                  className={`qc-preview-visual read-model-tone-${selectedTone}`}
                >
                  <span>{formatStatus(selectedItem.qc.latestStatus)}</span>
                  <strong>{selectedItem.assetId}</strong>
                  <small>{selectedItem.previewKey ?? "预览键待生成"}</small>
                </div>
                <div className="qc-selected-copy">
                  <p className="eyebrow">Selected QC</p>
                  <h2>{assetSkuLabel(selectedItem)}</h2>
                  <span>{assetShotLabel(selectedItem)}</span>
                  <span>
                    负责人：{selectedItem.retouch?.assignedTo ?? "待分配"}
                  </span>
                </div>
                <ReadOnlyActionPair
                  className="qc-suggestion-actions"
                  labels={[formatStatus(selectedItem.qc.nextAction), "只读建议"]}
                />
              </>
            ) : (
              <p>暂无 QC 项可预览。</p>
            )}
          </section>
        </div>
      </section>

      {selectedItem ? (
        <section className="qc-retouch-detail-grid" aria-label="QC 只读详情">
          <article
            className={`read-model-detail read-model-tone-${toneFromStatus(
              selectedItem.qc.latestStatus
            )}`}
          >
            <span>失败原因</span>
            <strong>
              {failedReasons.length > 0
                ? failedReasons.map((reason) => formatReason(reason)).join(" / ")
                : "未发现失败项"}
            </strong>
            <small>严重度：{formatStatus(selectedItem.qc.latestStatus)}</small>
          </article>
          <article
            className={`read-model-detail read-model-tone-${toneFromStatus(
              selectedItem.retouch?.status
            )}`}
          >
            <span>精修任务</span>
            <strong>{formatStatus(selectedItem.retouch?.status)}</strong>
            <small>
              {selectedItem.retouch?.assignedTo ?? "负责人待定"} / 截止{" "}
              {formatShortDateTime(selectedItem.retouch?.dueAt)}
            </small>
          </article>
          <article className="qc-result-panel read-model-detail read-model-tone-neutral">
            <span>技术检查</span>
            <strong>自动检查结果</strong>
            <QcResultList results={selectedItem.qc.technicalResults} />
          </article>
          <article className="qc-result-panel read-model-detail read-model-tone-neutral">
            <span>人工检查</span>
            <strong>制片与精修复核</strong>
            <QcResultList results={selectedItem.qc.manualResults} />
          </article>
          <article
            className={`read-model-detail qc-retouch-instructions read-model-tone-${selectedTone}`}
          >
            <span>返修说明</span>
            <strong>{selectedItem.retouch?.instructions ?? "暂无返修说明"}</strong>
            <small>
              复杂度：{formatStatus(selectedItem.retouch?.complexity)} / 修订{" "}
              {selectedItem.retouch?.revisionCount ?? 0} 次
            </small>
          </article>
          <article
            className={`read-model-detail read-model-tone-${toneFromStatus(
              selectedItem.qc.nextAction
            )}`}
          >
            <span>建议动作</span>
            <strong>{formatStatus(selectedItem.qc.nextAction)}</strong>
            <small>当前仅展示建议，业务写入未启用。</small>
          </article>
        </section>
      ) : null}
    </section>
  );
}

export function ReviewGalleryWorkspace({
  model,
  viewModel
}: {
  model: BackendReviewGallery;
  viewModel: ReadModelViewModel;
}) {
  const [selectedReviewItemId, setSelectedReviewItemId] = useState(
    model.items[0]?.reviewItemId ?? ""
  );
  const selectedItem = useMemo(
    () =>
      model.items.find((item) => item.reviewItemId === selectedReviewItemId) ??
      model.items[0],
    [model.items, selectedReviewItemId]
  );
  const selectedTone = selectedItem ? reviewItemTone(selectedItem) : "neutral";
  const summary = model.summary ?? {};
  const revisionCount =
    summary.revisionRequested ??
    model.items.filter((item) => item.status === "revision_requested").length;

  return (
    <section className="review-gallery-workspace">
      <ReadModelMetricStrip
        ariaLabel={`${viewModel.title} 指标面板`}
        className="review-gallery-metrics"
        metrics={viewModel.metrics}
      />

      <section className="review-gallery-console" aria-label="审核画廊工作台">
        <header className="review-gallery-summary">
          <div>
            <p className="eyebrow">Review Gallery</p>
            <strong>{model.title ?? model.reviewSessionId}</strong>
            <span>
              {formatStatus(model.status)} / 到期{" "}
              {formatShortDateTime(model.expiresAt)}
            </span>
          </div>
          <div className="review-gallery-summary-stats">
            <span>
              <b>{summary.pending ?? 0}</b>
              待审核
            </span>
            <span>
              <b>{summary.approved ?? 0}</b>
              已批准
            </span>
            <span>
              <b>{revisionCount}</b>
              需返修
            </span>
          </div>
        </header>

        <div className="review-gallery-body">
          <section className="review-gallery-panel" aria-label="审核素材网格">
            <div className="asset-panel-head">
              <div>
                <p className="eyebrow">Client Review Set</p>
                <strong>{model.reviewSessionId}</strong>
              </div>
              <span>{model.items.length} 个审核项</span>
            </div>
            <div className="review-card-grid">
              {model.items.map((item) => {
                const tone = reviewItemTone(item);

                return (
                  <button
                    aria-pressed={
                      item.reviewItemId === selectedItem?.reviewItemId
                    }
                    className={`review-card read-model-tone-${tone}`}
                    key={item.reviewItemId}
                    onClick={() => setSelectedReviewItemId(item.reviewItemId)}
                    type="button"
                  >
                    <span className="review-card-visual" aria-hidden="true">
                      <b>{item.assetId}</b>
                    </span>
                    <span className="review-card-copy">
                      <strong>{assetSkuLabel(item)}</strong>
                      <small>{assetShotLabel(item)}</small>
                      <small>
                        {item.clientComment ?? formatReason(item.issueType)}
                      </small>
                    </span>
                    <i>{formatStatus(item.status)}</i>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="review-selected-panel" aria-label="选中审核项">
            {selectedItem ? (
              <>
                <div
                  className={`review-preview-visual read-model-tone-${selectedTone}`}
                >
                  <span>{formatStatus(selectedItem.status)}</span>
                  <strong>{selectedItem.assetId}</strong>
                  <small>{selectedItem.previewKey ?? "预览键待生成"}</small>
                </div>
                <div className="review-selected-copy">
                  <p className="eyebrow">Selected Review</p>
                  <h2>{assetSkuLabel(selectedItem)}</h2>
                  <span>{assetShotLabel(selectedItem)}</span>
                  <span>
                    {selectedItem.clientComment ??
                      formatReason(selectedItem.issueType)}
                  </span>
                </div>
                <ReadOnlyActionPair
                  className="review-actions"
                  labels={["公开审核未启用", "反馈写入未启用"]}
                />
              </>
            ) : (
              <p>暂无审核项可预览。</p>
            )}
          </section>
        </div>
      </section>

      {selectedItem ? (
        <section className="review-detail-grid" aria-label="审核只读详情">
          <article
            className={`read-model-detail read-model-tone-${toneFromStatus(
              selectedItem.status
            )}`}
          >
            <span>审核状态</span>
            <strong>{formatStatus(selectedItem.status)}</strong>
            <small>
              {selectedItem.reviewedAt
                ? `客户确认 ${formatShortDateTime(selectedItem.reviewedAt)}`
                : "等待客户确认或反馈"}
            </small>
          </article>
          <article
            className={`read-model-detail read-model-tone-${selectedTone}`}
          >
            <span>客户反馈</span>
            <strong>
              {selectedItem.clientComment ??
                formatReason(selectedItem.issueType) ??
                "暂无客户反馈"}
            </strong>
            <small>当前仅展示反馈摘要，不开放评论写入。</small>
          </article>
          <article className="read-model-detail read-model-tone-neutral">
            <span>公开访问</span>
            <strong>{model.publicAccess.enabled ? "已启用" : "未启用"}</strong>
            <small>{formatReason(model.publicAccess.reason)}</small>
          </article>
        </section>
      ) : null}
    </section>
  );
}

export function DeliveryReadinessWorkspace({
  model,
  viewModel
}: {
  model: BackendDeliveryReadiness;
  viewModel: ReadModelViewModel;
}) {
  const artifacts = useMemo(() => createDeliveryArtifacts(model), [model]);
  const [selectedArtifactId, setSelectedArtifactId] = useState(
    artifacts[0]?.id ?? ""
  );
  const selectedArtifact =
    artifacts.find((artifact) => artifact.id === selectedArtifactId) ??
    artifacts[0];
  const checklistEntries = Object.entries(model.checklist) as Array<
    [DeliveryChecklistKey, boolean]
  >;
  const passedChecklistCount = checklistEntries.filter(([, value]) => value)
    .length;
  const selectedTone = selectedArtifact?.tone ?? "neutral";

  return (
    <section className="delivery-readiness-workspace">
      <ReadModelMetricStrip
        ariaLabel={`${viewModel.title} 指标面板`}
        className="delivery-readiness-metrics"
        metrics={viewModel.metrics}
      />

      <section className="delivery-readiness-console" aria-label="交付就绪工作台">
        <header className="delivery-readiness-summary">
          <div>
            <p className="eyebrow">Delivery Outbox</p>
            <strong>{model.deliveryId}</strong>
            <span>
              {formatStatus(model.status)} / 到期{" "}
              {formatShortDateTime(model.expiresAt)}
            </span>
          </div>
          <div className="delivery-readiness-summary-stats">
            <span>
              <b>{model.itemCount}</b>
              交付项
            </span>
            <span>
              <b>{passedChecklistCount}</b>
              检查通过
            </span>
            <span>
              <b>{model.blockers.length}</b>
              阻断项
            </span>
          </div>
        </header>

        <div className="delivery-readiness-body">
          <section className="delivery-artifact-panel" aria-label="交付包内容">
            <div className="asset-panel-head">
              <div>
                <p className="eyebrow">Package Contents</p>
                <strong>交付清单与包状态</strong>
              </div>
              <span>{artifacts.length} 组</span>
            </div>
            <div className="delivery-artifact-list">
              {artifacts.map((artifact) => (
                <button
                  aria-pressed={artifact.id === selectedArtifact?.id}
                  className={`delivery-artifact-card read-model-tone-${artifact.tone}`}
                  key={artifact.id}
                  onClick={() => setSelectedArtifactId(artifact.id)}
                  type="button"
                >
                  <span>{artifact.label}</span>
                  <strong>{artifact.title}</strong>
                  <small>{artifact.detail}</small>
                  <i>{formatStatus(artifact.status)}</i>
                </button>
              ))}
            </div>
          </section>

          <section className="delivery-selected-panel" aria-label="选中交付项">
            {selectedArtifact ? (
              <>
                <div
                  className={`delivery-preview-visual read-model-tone-${selectedTone}`}
                >
                  <span>{formatStatus(selectedArtifact.status)}</span>
                  <strong>{selectedArtifact.label}</strong>
                  <small>{selectedArtifact.detail}</small>
                </div>
                <div className="delivery-selected-copy">
                  <p className="eyebrow">Selected Output</p>
                  <h2>{selectedArtifact.title}</h2>
                  <span>{selectedArtifact.detail}</span>
                  <span>
                    外部访问：{model.externalAccess.enabled ? "已启用" : "未启用"}
                  </span>
                </div>
                <ReadOnlyActionPair
                  className="delivery-actions"
                  labels={["下载未开放", "外部交付未启用"]}
                />
              </>
            ) : (
              <p>暂无交付项可预览。</p>
            )}
          </section>
        </div>
      </section>

      <section className="delivery-detail-grid" aria-label="交付只读详情">
        {checklistEntries.map(([key, value]) => (
          <article
            className={`read-model-detail read-model-tone-${
              value ? "good" : "danger"
            }`}
            key={key}
          >
            <span>就绪检查</span>
            <strong>{deliveryChecklistLabels[key]}</strong>
            <small>{value ? "已满足要求" : "仍需人工处理"}</small>
          </article>
        ))}
        <article
          className={`read-model-detail read-model-tone-${
            model.blockers.length > 0 ? "danger" : "good"
          }`}
        >
          <span>阻断项</span>
          <strong>
            {model.blockers[0]
              ? formatReason(model.blockers[0].code)
              : "暂无阻断"}
          </strong>
          <small>
            {model.blockers[0]
              ? formatReason(model.blockers[0].message)
              : "当前交付检查均已清除。"}
          </small>
        </article>
        <article className="read-model-detail read-model-tone-neutral">
          <span>外部访问</span>
          <strong>{model.externalAccess.enabled ? "已启用" : "未启用"}</strong>
          <small>{formatReason(model.externalAccess.reason)}</small>
        </article>
      </section>
    </section>
  );
}
