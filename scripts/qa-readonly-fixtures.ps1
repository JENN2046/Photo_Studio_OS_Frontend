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

$ReadModelEntryTargets = @(
  @{
    Route = "asset-inbox"
    Label = "素材"
    Hash = $ReadOnlyRouteHashes.AssetInbox
    Selector = ".asset-inbox-console"
    ExpectedEncoded = @("%E7%B4%A0%E6%9D%90%E6%94%B6%E4%BB%B6%E7%AE%B1", "%E4%B8%8A%E4%BC%A0%E6%9C%AA%E5%90%AF%E7%94%A8")
  },
  @{
    Route = "qc-retouch"
    Label = "质检"
    Hash = $ReadOnlyRouteHashes.QcRetouch
    Selector = ".qc-retouch-console"
    ExpectedEncoded = @("%E8%B4%A8%E6%A3%80%20%2F%20%E7%B2%BE%E4%BF%AE%E9%98%9F%E5%88%97", "%E5%8F%AA%E8%AF%BB%E5%BB%BA%E8%AE%AE")
  },
  @{
    Route = "review-gallery"
    Label = "审核"
    Hash = $ReadOnlyRouteHashes.ReviewGallery
    Selector = ".review-gallery-console"
    ExpectedEncoded = @("%E5%AE%A1%E6%A0%B8%E7%94%BB%E5%BB%8A", "%E5%85%AC%E5%BC%80%E5%AE%A1%E6%A0%B8%E6%9C%AA%E5%90%AF%E7%94%A8")
  },
  @{
    Route = "delivery-readiness"
    Label = "交付"
    Hash = $ReadOnlyRouteHashes.DeliveryReadiness
    Selector = ".delivery-readiness-console"
    ExpectedEncoded = @("%E4%BA%A4%E4%BB%98%E5%B0%B1%E7%BB%AA", "%E4%B8%8B%E8%BD%BD%E6%9C%AA%E5%BC%80%E6%94%BE")
  }
)
