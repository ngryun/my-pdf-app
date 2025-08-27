// 이 코드는 Netlify 서버에서만 실행됩니다.
// 따라서 process.env.GEMINI_API_KEY는 브라우저에 노출되지 않습니다.

// Node.js용 라이브러리를 사용합니다.
import { GoogleGenerativeAI } from "@google/genai";

export const handler = async (event) => {
  // 1. API 키를 Netlify 환경변수에서 안전하게 가져옵니다.
  const API_KEY = process.env.GEMINI_API_KEY;

  // 2. 프론트엔드에서 보낸 텍스트 데이터를 받습니다.
  const { text } = JSON.parse(event.body);

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `From the following text, extract only the complete English sentences. List each sentence on a new line. Do not add any numbering, bullet points, or introductory text.\n\n---\n\nTEXT: "${text}"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiResponseText = response.text();

    // 3. 성공 결과를 다시 프론트엔드로 보내줍니다.
    return {
      statusCode: 200,
      body: JSON.stringify({ sentences: aiResponseText }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "AI processing failed." }),
    };
  }
};