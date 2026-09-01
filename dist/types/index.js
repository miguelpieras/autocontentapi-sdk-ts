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
export const extensionAsset = (assetType, fields = {}) => {
    const normalized = assetType.trim();
    if (normalized.length === 0 || knownAssetTypes.has(normalized)) {
        throw new TypeError('extensionAsset requires a non-empty Asset type not built into this SDK version.');
    }
    return { ...fields, asset_type: normalized };
};
//# sourceMappingURL=index.js.map