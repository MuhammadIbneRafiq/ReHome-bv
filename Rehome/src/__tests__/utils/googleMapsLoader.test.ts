import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isGoogleMapsLoaded } from '../../utils/googleMapsLoader';

describe('googleMapsLoader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('isGoogleMapsLoaded function is exported and callable', () => {
    // Verify the function exists and returns a boolean
    const result = isGoogleMapsLoaded();
    expect(typeof result).toBe('boolean');
  });
});
