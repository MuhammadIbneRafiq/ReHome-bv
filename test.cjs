// Test script to verify furniture upload works after RLS fix
const https = require('https');

const token = 'eyJhbGciOiJIUzI1NiIsImtpZCI6IjV0TnRSYzhXREt0ZkhteWYiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3lobGVudWRja3dld21lamlneHZsLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJiMmVlNDVmNC00YmNhLTQyZDEtOWFhYi04OTFhMzg4MjY4OWYiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzQ5OTA5MTM4LCJpYXQiOjE3NDk5MDU1MzgsImVtYWlsIjoibXVoYW1tYWRpYm5lcmFmaXExMjNAZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbCI6Im11aGFtbWFkaWJuZXJhZmlxMTIzQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInN1YiI6ImIyZWU0NWY0LTRiY2EtNDJkMS05YWFiLTg5MWEzODgyNjg5ZiJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6InBhc3N3b3JkIiwidGltZXN0YW1wIjoxNzQ5OTA1NTM4fV0sInNlc3Npb25faWQiOiJkN2U5OTllZC0yYzBjLTQ0NTQtYTVkYS01OGQ2NTVmMmI2ZGQiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.V18w45TOirPhsmN4mj1MKnfRUu3lBztliKJPcoQlW4E';

function makeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: responseData
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function testUploadAfterFix() {
  try {
    console.log('🧪 Testing furniture upload after RLS policy fix...');
    
    const furnitureData = {
      name: 'Test Sofa After Fix',
      description: 'Testing if RLS policy fix works',
      imageUrl: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc'],
      price: 299,
      cityName: 'Amsterdam',
      isRehome: false,
      category: 'Sofas and Chairs',
      subcategory: 'Sofa',
      conditionRating: 2,
      height: 85,
      width: 200,
      depth: 90,
      pricingType: 'fixed',
      latitude: 52.3676,
      longitude: 4.9041
    };
    
    const result = await makeRequest('https://rehome-backend.vercel.app/api/furniture/new', furnitureData);
    
    console.log('📊 RESULT:');
    console.log('Status:', result.status);
    console.log('Response:', result.data);
    
    if (result.status === 201 || result.status === 200) {
      console.log('✅ SUCCESS! Furniture upload is now working!');
    } else {
      console.log('❌ STILL FAILING. Status:', result.status);
      console.log('Response:', result.data);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testUploadAfterFix();