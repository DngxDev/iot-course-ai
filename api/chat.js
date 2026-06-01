export default async function handler(req, res) {
  // Chỉ chấp nhận method POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Gọi sang Anthropic API từ Server của Vercel (Không lo CORS)
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        // Lấy API Key bí mật từ biến môi trường của Vercel
        'x-api-key': process.env.ANTHROPIC_API_KEY 
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    
    // Trả kết quả về cho Frontend
    if (!response.ok) {
      return res.status(response.status).json(data);
    }
    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}