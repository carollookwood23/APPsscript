function onEdit(e) {
  const activeSheet = e.source.getActiveSheet();

  // Only run on Sheet1
  if (activeSheet.getName() !== "Sheet1") return;

  const sheet = activeSheet;
  const row = e.range.getRow();
  const col = e.range.getColumn();

  // Only run when editing Column A, and row ≥ 2
  if (col !== 1 || row < 2) return;

  const topic = e.range.getValue();
  if (!topic) return;

  // Show loading indicators while API generates output
  sheet.getRange(row, 2).setValue("Generating…");
  sheet.getRange(row, 3).setValue("Generating…");
  sheet.getRange(row, 4).setValue("Generating…");
  sheet.getRange(row, 5).setValue("Generating…");

  generateMeta(topic, sheet, row);
  getTopResult(topic, sheet, row);
}

function generateMeta(topic, sheet, row) {
  const API_KEY = "AIzaSyBeZV186dd3SYsGnydPnHWaeoosv9cArts"; // replace this with your key
  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + API_KEY;

  const prompt = `
  You are an expert SEO copywriter.
  Generate the following for the blog topic: "${topic}"
  1) Meta Title (max 60 chars)
  2) Meta Description (max 155 chars)
  3) URL Slug (lowercase, hyphens only)
  
  Return in JSON:
  {
    "title": "",
    "description": "",
    "slug": ""
  }
  `;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }]
  };

  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload)
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const json = JSON.parse(response.getContentText());
    const aiText = json.candidates[0].content.parts[0].text;

    let clean;

    try {
      // Extract JSON from text using regex
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        clean = JSON.parse(jsonMatch[0].trim());
      } else {
        throw new Error("JSON not found");
      }
    } catch (err) {
      clean = {
        title: "Parse Error",
        description: "Could not parse JSON",
        slug: "parse-error"
      };
    }

    // Write AI output
    sheet.getRange(row, 2).setValue(clean.title);
    sheet.getRange(row, 3).setValue(clean.description);
    sheet.getRange(row, 4).setValue(clean.slug);

  } catch (error) {
    // If API fails, show error
    sheet.getRange(row, 2).setValue("Generating…");
    sheet.getRange(row, 3).setValue("Generating…");
    sheet.getRange(row, 4).setValue("Generating…");
  }
}

function getTopResult(topic, sheet, row) {
  const apiKey = 'af4cd08b48335d7ef8adee10fcd3961b5e4094c3922a37c69358b33df7eb78de';
  const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(topic)}&api_key=${apiKey}`;

  try {
    const response = UrlFetchApp.fetch(url);
    const data = JSON.parse(response.getContentText());

    // ---------------------
    // 1️⃣ Top organic URL (Column E)
    // ---------------------
    let competitors = "No organic results found";
    
  if (data.organic_results && data.organic_results.length > 0) {
    competitors = data.organic_results
    .slice(0, 3) // top 3
    .map(r => r.link)
    .join("\n");  // each on new line
}

sheet.getRange(row, 5).setValue(competitors);


    // ---------------------
    // 2️⃣ Related Questions (PAA → Column F)
    // ---------------------
    let questions = "No related questions found";

    if (data.related_questions && data.related_questions.length > 0) {
      questions = data.related_questions
        .map(q => q.question)
        .join("\n");
    }

    sheet.getRange(row, 6).setValue(questions);


    // ---------------------
    // 3️⃣ PASF (People Also Search For → Column G)
    // ---------------------
    let pasf = "No PASF found";

    if (data.related_searches && data.related_searches.length > 0) {
      pasf = data.related_searches
      .map(item => item.query)
      .join("\n");   // ← newline instead of comma
}

    sheet.getRange(row, 7).setValue(pasf);

    // ---------------------
// 4️⃣ Discussions & Forums (Reddit, Quora, Forums)
// ---------------------
    let discussions = "No discussions found";

    if (data.discussions_and_forums && data.discussions_and_forums.length > 0) {
      discussions = data.discussions_and_forums
      .map(item => `${item.title}\n${item.link}`)
      .join("\n\n");  // spacing between results
}

sheet.getRange(row, 8).setValue(discussions);  // Column H

  } catch (err) {
    sheet.getRange(row, 5).setValue("Generating…");
    sheet.getRange(row, 6).setValue("Generating…");
    sheet.getRange(row, 7).setValue("Generating…");
    sheet.getRange(row, 8).setValue("Generating…");
  }
}
