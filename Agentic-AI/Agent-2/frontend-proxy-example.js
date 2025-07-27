// Frontend API Proxy - Place this in your frontend project
// Path: /pages/api/store-receipt.js (for Pages Router)
// OR: /app/api/store-receipt/route.js (for App Router)

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Proxying request to Python API...');
    
    // Forward the request to your Python API
    const response = await fetch('http://localhost:8081/store-receipt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    
    console.log('Python API response:', data);
    
    // Return the response with the same status code
    return res.status(response.status).json(data);
    
  } catch (error) {
    console.error('API proxy error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      detail: error.message
    });
  }
}

// For App Router (Next.js 13+), use this format instead:
/*
export async function POST(request) {
  try {
    const body = await request.json();
    
    const response = await fetch('http://localhost:8081/store-receipt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Internal server error',
      detail: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
*/
