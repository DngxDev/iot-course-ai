module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY; // Lấy key của Google từ Vercel
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    // 1. Dịch lịch sử chat sang chuẩn của Gemini (assistant -> model)
    const geminiMessages = req.body.messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // 2. Định dạng lại System Prompt (Luật của AI)
    const customPrompt = `Bạn là một chuyên gia kỹ thuật phần cứng và lập trình nhúng IoT lão luyện. 
    Nhiệm vụ của bạn là hỗ trợ học viên:
    1. Nếu người dùng gửi code (C/C++), hãy review mã nguồn. Chú ý đặc biệt đến việc cấu hình chân (GPIO, ADC, Timer), khai báo biến, và các vòng lặp delay có thể gây treo hệ thống.
    2. Nếu code liên quan đến vi điều khiển (như PIC16F877A, ESP32...) hoặc các bài toán giám sát thực tế (cảnh báo mưa lũ, mạch đo nhiệt độ độ ẩm, ánh sáng trong cây trồng...), hãy đưa ra lời khuyên về chống nhiễu phần cứng và gợi ý tối ưu.
    3. Luôn trình bày code mẫu bằng định dạng Markdown để dễ đọc, và giải thích ngắn gọn dưới 300 chữ.`;

    const systemInstruction = {
      role: "system",
      parts: [{ text: customPrompt }]
    };

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