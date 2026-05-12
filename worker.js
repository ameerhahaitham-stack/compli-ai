export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }

    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'healthy',
        service: 'CompliAI API'
      }), { headers: { ...cors, 'Content-Type': 'application/json' }});
    }

    if (url.pathname === '/api/analyze' && request.method === 'POST') {
      const body = await request.json();
      
      const prompt = `Analyze impact of ${body.regulationName} on ${body.companyName} (${body.industry}). Return JSON with: applicabilityScore (0-100), riskLevel, summary, personalizedActionPlan (array of tasks with step, task, priority, estimatedHours, aiSuggestedAssignee, complianceDeadline, rationale), estimatedCosts (totalHours, totalEstimatedCost, compliAiAutomationSavings).`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1, responseMimeType: 'application/json' }
          })
        }
      );

      const data = await res.json();
      const text = data.candidates[0].content.parts[0].text;
      const analysis = JSON.parse(text);

      return new Response(JSON.stringify({
        ...analysis,
        _meta: {
          aiGenerated: true,
          disclaimer: 'This analysis requires review by legal counsel. CompliAI does not provide legal advice.',
          watermark: '[DRAFT - PENDING HUMAN REVIEW]'
        }
      }), { headers: { ...cors, 'Content-Type': 'application/json' }});
    }

    return new Response(JSON.stringify({ error: 'Not found' }), { 
      status: 404, 
      headers: { ...cors, 'Content-Type': 'application/json' }
    });
  }
};