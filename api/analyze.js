export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { companyName, industry, regulationName } = req.body;

  const prompt = `Analyze impact of ${regulationName} on ${companyName} (${industry}). Return JSON: {applicabilityScore, riskLevel, summary, personalizedActionPlan: [{step, task, priority, estimatedHours, aiSuggestedAssignee, complianceDeadline, rationale}], estimatedCosts: {totalHours, totalEstimatedCost, compliAiAutomationSavings}}`;

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, responseMimeType: 'application/json' }
      })
    }
  );

  const data = await geminiRes.json();
  const text = data.candidates[0].content.parts[0].text;
  const analysis = JSON.parse(text);

  res.status(200).json({
    ...analysis,
    _meta: {
      aiGenerated: true,
      disclaimer: 'Requires legal review. CompliAI does not provide legal advice.',
      watermark: '[DRAFT - PENDING HUMAN REVIEW]'
    }
  });
}
