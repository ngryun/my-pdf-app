// Netlify Function: convertHwp
// Purpose: Accept a base64-encoded .hwp file and forward it to an external
// conversion service (e.g., a self-hosted LibreOffice headless microservice)
// and return extracted plain text.

export async function handler(event) {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { filename, fileBase64 } = JSON.parse(event.body || '{}');
    if (!fileBase64) {
      return { statusCode: 400, body: 'Missing fileBase64' };
    }

    const converterUrl = process.env.HWP_CONVERTER_URL;
    if (!converterUrl) {
      // Provide guidance on setup
      return {
        statusCode: 501,
        body: 'HWP_CONVERTER_URL is not configured. Deploy a converter (e.g., Docker: libreoffice --headless) and set env var to its POST endpoint.'
      };
    }

    // Forward to converter as JSON or multipart. Here: JSON with base64 to keep it simple.
    const res = await fetch(converterUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: filename || 'file.hwp', fileBase64 })
    });

    if (!res.ok) {
      const t = await res.text();
      return { statusCode: 502, body: `Converter error: ${t || res.status}` };
    }

    const data = await res.json().catch(() => ({}));
    const text = typeof data.text === 'string' ? data.text : '';
    if (!text.trim()) {
      return { statusCode: 500, body: 'Converter returned no text' };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    };
  } catch (err) {
    return { statusCode: 500, body: `Internal error: ${err.message}` };
  }
}

