const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');

exports.handler = async (event, context) => {
  const url = event.queryStringParameters.url;
  const width = parseInt(event.queryStringParameters.width) || 1280;
  const height = parseInt(event.queryStringParameters.height) || 720;
  
  if (!url) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'URL parameter is required' })
    };
  }

  let browser = null;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: null,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    
    // Set the viewport size
    await page.setViewport({ width, height });
    
    // Navigate to the page and wait for it to load
    await page.goto(url, { waitUntil: 'networkidle0' });
    
    // Take the screenshot
    const screenshot = await page.screenshot({ 
      encoding: 'base64',
      fullPage: false // This ensures we only capture the viewport
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ image: `data:image/png;base64,${screenshot}` }),
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to capture screenshot' })
    };
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
};
