const chromium = require("@sparticuz/chromium");
const puppeteer = require('puppeteer-core');

exports.handler = async function(event, context) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  // Handle OPTIONS request for CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  const url = event.queryStringParameters.url;
  const width = parseInt(event.queryStringParameters.width) || 1280;
  const height = parseInt(event.queryStringParameters.height) || 720;

  if (!url) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'URL parameter is required' })
    };
  }

  let browser = null;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width, height },
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.goto(url, { 
      waitUntil: 'networkidle0',
      timeout: 25000 // 25 seconds timeout
    });

    const screenshot = await page.screenshot({ 
      encoding: 'base64',
      fullPage: false
    });

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ image: `data:image/png;base64,${screenshot}` })
    };
  } catch (error) {
    console.error('Screenshot error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to capture screenshot', 
        details: error.message 
      })
    };
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
};
