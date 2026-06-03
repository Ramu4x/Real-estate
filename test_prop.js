async function testAddProperty() {
  try {
    const loginRes = await fetch('http://localhost:5003/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'seller@example.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok) {
      console.log('Login failed', loginData);
      return;
    }
    console.log('Login successful');
    const token = loginData.token;

    const formData = new FormData();
    formData.append('title', 'Test House');
    formData.append('description', 'A nice house');
    formData.append('price', '500000');
    formData.append('type', 'house');
    formData.append('location', 'New York');
    
    const propRes = await fetch('http://localhost:5003/api/properties', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    const propData = await propRes.json();
    console.log('Property res:', propData);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAddProperty();
