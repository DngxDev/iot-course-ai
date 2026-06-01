export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY; // Lấy key của Google từ Vercel
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    // 1. Dịch lịch sử chat sang chuẩn của Gemini (assistant -> model)
    const geminiMessages = req.body.messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // 2. Định dạng lại System Prompt (Luật của AI)
    const systemInstruction = req.body.system ? {
      role: "system",
      parts: [{ text: req.body.system }]
    } : undefined;

    // 3. Gọi sang Google Gemini
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: systemInstruction,
        contents: geminiMessages
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    // 4. Lấy câu trả lời và "giả dạng" thành cấu trúc cũ để file HTML hiểu được
    const replyText = data.candidates[0].content.parts[0].text;
    
    return res.status(200).json({
      content: [{ type: 'text', text: replyText }]
    });

  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}