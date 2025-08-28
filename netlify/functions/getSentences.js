// 올바른 패키지 import
import { GoogleGenerativeAI } from "@google/generative-ai";

export const handler = async (event, context) => {
  // CORS 헤더 추가
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };

  // Preflight 요청 처리
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: ""
    };
  }

  try {
    // 1. API 키를 Netlify 환경변수에서 가져오기
    const API_KEY = process.env.GEMINI_API_KEY;
    
    if (!API_KEY) {
      console.error("GEMINI_API_KEY가 설정되지 않았습니다.");
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "API key is not configured." })
      };
    }

    // 2. 프론트엔드에서 보낸 데이터 파싱
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Request body is missing." })
      };
    }

    const { text } = JSON.parse(event.body);
    
    if (!text) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Text data is missing." })
      };
    }

    // 3. Gemini AI 모델 초기화
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are an expert English teacher.\n\nContext:\n- The uploaded document is an English worksheet for Korean students.\n\nTask:\n1) Solve the worksheet items to derive the correct, complete English sentences (e.g., fill in blanks, fix errors, reorder words, complete fragments).\n2) Collect ALL final, correct sentences that result from solving the items.\n\nOutput format (very important):\n- Return ONLY the list, one sentence per line.\n- Each line MUST start with the Korean label and index exactly like: \"문장1.\", \"문장2.\", \"문장3.\" (no spaces between label and number).\n- After the label, add a single space, then the final correct sentence.\n- Do not include any extra text, explanations, headings, bullet points, or code fences.\n- If nothing can be solved, return an empty output.\n\n---\n\nTEXT: "${text}"`;

    // 4. AI 모델에 텍스트 생성 요청
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiResponseText = response.text();

    // 5. 성공 응답
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ sentences: aiResponseText })
    };

  } catch (error) {
    console.error("Error in getSentences function:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: "AI processing failed.", 
        details: error.message 
      })
    };
  }
};
