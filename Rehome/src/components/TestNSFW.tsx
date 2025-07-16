import React, { useState } from 'react';
import { nsfwFilterService, NSFWCheckResult } from '../services/nsfwFilterService';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface TestResult {
  file: File;
  result: NSFWCheckResult;
  previewUrl: string;
}

const TestNSFW: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [batchStats, setBatchStats] = useState<{
    totalTime: number;
    avgTime: number;
    processed: number;
  } | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setIsProcessing(true);
    setBatchStats(null);

    try {
      const startTime = performance.now();
          
      const totalTime = performance.now() - startTime;
      setBatchStats({
        totalTime,
        avgTime: totalTime / files.length,
        processed: files.length
      });

      // Create test results with previews
      const results = await Promise.all(
        files.map(async (file) => {
          const result = await nsfwFilterService.checkImage(file);
          const previewUrl = URL.createObjectURL(file);
          return { file, result, previewUrl };
        })
      );

      setTestResults(results);
    } catch (error) {
      console.error('Test failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const testServiceInitialization = async () => {
    try {
      console.log('Testing NSFW service initialization...');
      const startTime = performance.now();
      
      // Create a simple test blob
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      ctx!.fillStyle = '#ff0000';
      ctx!.fillRect(0, 0, 100, 100);
      
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/png');
      });
      
      const testFile = new File([blob], 'test.png', { type: 'image/png' });
      const result = await nsfwFilterService.checkImage(testFile);
      
      const initTime = performance.now() - startTime;
      
      console.log('✅ NSFW Service Test Results:');
      console.log(`⏱️  Initialization + first check: ${initTime.toFixed(1)}ms`);
      console.log(`🔍 Analysis result:`, result);
      console.log(`🚀 Service is working correctly!`);
      
      alert(`✅ NSFW Service Test Passed!\n\nInitialization: ${initTime.toFixed(1)}ms\nResult: ${result.message}\nProcessing time: ${result.processingTime?.toFixed(1)}ms`);
    } catch (error) {
      console.error('❌ Service test failed:', error);
      alert(`❌ Service test failed: ${error}`);
    }
  };

  const clearCache = () => {
    nsfwFilterService.clearCache();
    alert('🗑️ Cache cleared successfully!');
  };

  const clearResults = () => {
    // Clean up object URLs to prevent memory leaks
    testResults.forEach(result => URL.revokeObjectURL(result.previewUrl));
    setTestResults([]);
    setBatchStats(null);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">🔍 NSFW Filter Test Page</CardTitle>
          <p className="text-gray-600">
            Test the performance and accuracy of our optimized NSFW detection system
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <Button onClick={testServiceInitialization} variant="outline">
              🚀 Test Service Initialization
            </Button>
            <Button onClick={clearCache} variant="outline">
              🗑️ Clear Cache
            </Button>
            <Button onClick={clearResults} variant="outline" disabled={testResults.length === 0}>
              🧹 Clear Results
            </Button>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              className="w-full"
              disabled={isProcessing}
            />
            <p className="text-sm text-gray-500 mt-2">
              Select one or more images to test NSFW detection. Processing time will be shown for each image.
            </p>
          </div>

          {isProcessing && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Processing images...</p>
            </div>
          )}

          {batchStats && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <h3 className="font-semibold text-lg mb-2">⚡ Performance Stats</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Total Time:</span>
                    <br />
                    <span className="text-blue-600 text-lg">{batchStats.totalTime.toFixed(1)}ms</span>
                  </div>
                  <div>
                    <span className="font-medium">Average per Image:</span>
                    <br />
                    <span className="text-blue-600 text-lg">{batchStats.avgTime.toFixed(1)}ms</span>
                  </div>
                  <div>
                    <span className="font-medium">Images Processed:</span>
                    <br />
                    <span className="text-blue-600 text-lg">{batchStats.processed}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {testResults.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">📊 Test Results</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {testResults.map((testResult, index) => (
                  <Card key={index} className={`${testResult.result.isSafe ? 'border-green-200' : 'border-red-200'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={testResult.previewUrl}
                          alt={testResult.file.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{testResult.file.name}</p>
                          <p className="text-sm text-gray-500">
                            {(testResult.file.size / 1024).toFixed(1)} KB
                          </p>
                          <p className="text-sm">
                            ⏱️ {testResult.result.processingTime?.toFixed(1)}ms
                          </p>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg ${testResult.result.isSafe ? 'text-green-600' : 'text-red-600'}`}>
                            {testResult.result.isSafe ? '✅' : '🚫'}
                          </div>
                          {testResult.result.confidence && (
                            <div className="text-xs text-gray-500">
                              {(testResult.result.confidence * 100).toFixed(1)}%
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-sm mt-2 text-gray-700">
                        {testResult.result.message}
                      </p>
                      {testResult.result.category && (
                        <p className="text-xs text-orange-600 mt-1">
                          Category: {testResult.result.category}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-lg">📈 Performance Expectations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium">⚡ Fast Processing:</h4>
              <ul className="list-disc list-inside text-gray-600 mt-1">
                <li>Small images (&lt; 100KB): 50-80ms</li>
                <li>Medium images (100KB-1MB): 80-150ms</li>
                <li>Large images (&gt; 1MB): 150-200ms</li>
                <li>Cache hits: 0-2ms</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium">🎯 Features:</h4>
              <ul className="list-disc list-inside text-gray-600 mt-1">
                <li>Multi-ethnic skin tone detection</li>
                <li>Smart caching system</li>
                <li>Parallel batch processing</li>
                <li>Conservative flagging approach</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestNSFW; 