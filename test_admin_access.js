import https from 'https';

// First, let's login with the main account and get the token
const loginData = JSON.stringify({
  email: "muhammadibnerafiq@gmail.com",
  password: "12345678"
});

const loginOptions = {
  hostname: 'rehome-backend.vercel.app',
  port: 443,
  path: '/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': loginData.length
  }
};

console.log('🔐 Testing admin access for muhammadibnerafiq@gmail.com...');

const loginReq = https.request(loginOptions, (res) => {
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200) {
      try {
        const loginResponse = JSON.parse(body);
        const accessToken = loginResponse.accessToken;
        
        console.log('✅ Login successful! Token obtained.');
        
        // Now test admin endpoint access
        testAdminEndpoint(accessToken);
        
      } catch (error) {
        console.error('❌ Error parsing login response:', error);
      }
    } else {
      console.error(`❌ Login failed with status ${res.statusCode}:`, body);
    }
  });
});

loginReq.on('error', (error) => {
  console.error('❌ Login request error:', error);
});

loginReq.write(loginData);
loginReq.end();

// Function to test admin endpoint
function testAdminEndpoint(token) {
  const adminOptions = {
    hostname: 'rehome-backend.vercel.app',
    port: 443,
    path: '/api/furniture-items',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  console.log('🔧 Testing admin endpoint /api/furniture-items...');

  const adminReq = https.request(adminOptions, (res) => {
    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });
    
    res.on('end', () => {
      console.log(`📊 Admin endpoint status: ${res.statusCode}`);
      
      if (res.statusCode === 200) {
        console.log('🎉 SUCCESS! Admin access granted!');
        console.log('Response preview:', body.substring(0, 200) + '...');
      } else {
        console.log('❌ Admin access denied:', body);
      }
    });
  });

  adminReq.on('error', (error) => {
    console.error('❌ Admin request error:', error);
  });

  adminReq.end();
} 