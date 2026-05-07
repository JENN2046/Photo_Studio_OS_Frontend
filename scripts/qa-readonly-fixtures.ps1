# Shared read-only QA fixtures.
# Safe local constants only; this file does not call external services or write state.

$GoldenLoopIds = @{
  ProjectId = "PRJ-128"
  ReviewSessionId = "REV-441"
  DeliveryId = "DEL-220"
}

$GoldenLoopQuery = "projectId=$($GoldenLoopIds.ProjectId)&reviewSessionId=$($GoldenLoopIds.ReviewSessionId)&deliveryId=$($GoldenLoopIds.DeliveryId)"

$ReadModelRouteNames = @(
  "asset-inbox",
  "qc-retouch",
  "review-gallery",
  "delivery-readiness"
)

$ReadOnlyRouteHashes = @{
  CommandCenter = "#"
  CommandCenterLoading = "?commandCenterState=loading#"
  CommandCenterError = "?commandCenterState=error#"
  CommandCenterInvalidState = "?commandCenterState=invalid#"
  AssetInbox = "#asset-inbox?$GoldenLoopQuery"
  QcRetouch = "#qc-retouch?$GoldenLoopQuery"
  ReviewGallery = "#review-gallery?$GoldenLoopQuery"
  DeliveryReadiness = "#delivery-readiness?$GoldenLoopQuery"
  AssetInboxIdle = "#asset-inbox?reviewSessionId=$($GoldenLoopIds.ReviewSessionId)&deliveryId=$($GoldenLoopIds.DeliveryId)"
  QcRetouchIdle = "#qc-retouch?reviewSessionId=$($GoldenLoopIds.ReviewSessionId)&deliveryId=$($GoldenLoopIds.DeliveryId)"
  ReviewGalleryIdle = "#review-gallery?projectId=$($GoldenLoopIds.ProjectId)&deliveryId=$($GoldenLoopIds.DeliveryId)"
  DeliveryReadinessIdle = "#delivery-readiness?projectId=$($GoldenLoopIds.ProjectId)&reviewSessionId=$($GoldenLoopIds.ReviewSessionId)"
  AssetInboxInvalidState = "#asset-inbox?$GoldenLoopQuery&readModelState=invalid"
}
