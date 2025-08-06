// Mock data for testing duplicate detection scenarios
export const MOCK_TEST_SCENARIOS = {
  // Scenario 1: Exact duplicates (same hash, size, filename)
  exactDuplicates: [
    {
      name: "vacation_beach_2023.jpg",
      size: 2457600, // 2.4MB
      hash: "a1b2c3d4e5f6",
      filename: "vacation_beach_2023.jpg"
    },
    {
      name: "vacation_beach_2023 (1).jpg", // Copy with different name
      size: 2457600,
      hash: "a1b2c3d4e5f6",
      filename: "vacation_beach_2023 (1).jpg"
    }
  ],

  // Scenario 2: Similar filenames but different content
  similarNames: [
    {
      name: "sunset_beach_01.jpg",
      size: 1843200,
      hash: "x1y2z3a4b5c6",
      filename: "sunset_beach_01.jpg"
    },
    {
      name: "sunset_beach_02.jpg", 
      size: 1956000,
      hash: "m7n8o9p0q1r2",
      filename: "sunset_beach_02.jpg"
    }
  ],

  // Scenario 3: Same content, different file sizes (compression)
  sameContentDifferentSizes: [
    {
      name: "portrait_original.jpg",
      size: 5242880, // 5MB original
      hash: "p1q2r3s4t5u6",
      filename: "portrait_original.jpg"
    },
    {
      name: "portrait_compressed.jpg",
      size: 1048576, // 1MB compressed
      hash: "p1q2r3s4t5u6", // Same hash - same visual content
      filename: "portrait_compressed.jpg"
    }
  ],

  // Scenario 4: Visually similar but different hashes
  visuallySimilar: [
    {
      name: "mountain_view_dawn.jpg",
      size: 3145728,
      hash: "d1a2w3n4m5t6",
      filename: "mountain_view_dawn.jpg"
    },
    {
      name: "mountain_view_dusk.jpg", // Similar scene, different lighting
      size: 3087654,
      hash: "d7u8s9k0m1t2", // Different hash
      filename: "mountain_view_dusk.jpg",
      visualSimilarity: 0.85 // 85% visually similar
    }
  ],

  // Scenario 5: Burst photos (sequential shots)
  burstPhotos: [
    {
      name: "action_shot_001.jpg",
      size: 2097152,
      hash: "b1u2r3s4t5_1",
      filename: "action_shot_001.jpg"
    },
    {
      name: "action_shot_002.jpg",
      size: 2105344, // Slightly different size
      hash: "b1u2r3s4t5_2", // Different hash
      filename: "action_shot_002.jpg",
      visualSimilarity: 0.92 // Very similar - burst sequence
    },
    {
      name: "action_shot_003.jpg",
      size: 2089984,
      hash: "b1u2r3s4t5_3",
      filename: "action_shot_003.jpg",
      visualSimilarity: 0.89
    }
  ],

  // Scenario 6: False positives (different photos with similar characteristics)
  falsePositives: [
    {
      name: "cat_photo_01.jpg",
      size: 1572864, // Same file size by coincidence
      hash: "c1a2t3p4h5o6",
      filename: "cat_photo_01.jpg"
    },
    {
      name: "dog_photo_15.jpg",
      size: 1572864, // Same size
      hash: "d1o2g3p4h5o6", // Different hash
      filename: "dog_photo_15.jpg",
      visualSimilarity: 0.25 // Not visually similar
    }
  ],

  // Scenario 7: Different formats of same image
  differentFormats: [
    {
      name: "artwork_final.jpg",
      size: 4194304,
      hash: "a1r2t3w4o5r6",
      filename: "artwork_final.jpg"
    },
    {
      name: "artwork_final.png", // Same image, PNG format
      size: 8388608, // Larger due to PNG format
      hash: "a1r2t3w4o5r6", // Same content hash
      filename: "artwork_final.png"
    }
  ]
}

// Helper function to generate test descriptions
export const getTestScenarioDescription = (scenarioKey: string): string => {
  const descriptions: Record<string, string> = {
    exactDuplicates: "Tests detection of exact duplicate files with identical content but potentially different filenames",
    similarNames: "Tests filename similarity detection with different actual content",
    sameContentDifferentSizes: "Tests hash-based detection for same content in different file sizes (compression scenarios)", 
    visuallySimilar: "Tests visual similarity detection for related but technically different images",
    burstPhotos: "Tests handling of photo burst sequences with high visual similarity",
    falsePositives: "Tests avoiding false positives when files share characteristics but are actually different",
    differentFormats: "Tests detection across different file formats of the same image"
  }
  
  return descriptions[scenarioKey] || "Unknown test scenario"
}

// Expected results for validation
export const EXPECTED_RESULTS = {
  // High threshold (95%) with hash only - should catch exact duplicates and same content
  highThresholdHashOnly: {
    exactDuplicates: 2,
    sameContentDifferentSizes: 2,
    differentFormats: 2,
    others: 0
  },
  
  // Medium threshold (85%) with multiple methods - should catch more similarities
  mediumThresholdMultiMethod: {
    exactDuplicates: 2,
    sameContentDifferentSizes: 2,
    visuallySimilar: 2,
    burstPhotos: 3,
    differentFormats: 2,
    others: 0
  },
  
  // Low threshold (70%) with visual similarity - should catch almost everything
  lowThresholdVisual: {
    exactDuplicates: 2,
    sameContentDifferentSizes: 2,
    visuallySimilar: 2,
    burstPhotos: 3,
    differentFormats: 2,
    falsePositives: 0 // Should still avoid false positives
  }
}