import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient, resolveGeminiModel } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const ai = getGeminiClient();
    const body = await req.json();
    const { customer } = body;

    if (!customer) {
      return NextResponse.json({ success: false, error: 'Customer data is required' }, { status: 400 });
    }

    const waitMins = Number(customer.WaitTime).toFixed(1);
    const avgSpend = Number(customer.AverageSpend).toFixed(2);

    const prompt = `
You are the DineIntellect Operational Incident Diagnostic Engine.
Provide a sharp, concise root-cause diagnosis for this restaurant dining incident.
DO NOT write letters, apologies, or generic customer service pleasantries. Deliver executive operational insights only.

INCIDENT METRICS:
- Customer ID: ${customer.CustomerID}
- Cuisine & Occasion: ${customer.PreferredCuisine}, ${customer.DiningOccasion}, ${customer.MealType}
- Wait Time: ${waitMins} mins
- Ratings: Service ${customer.ServiceRating}/5, Food ${customer.FoodRating}/5, Ambiance ${customer.AmbianceRating}/5
- Average Spend: $${avgSpend}
- Loyalty Member: ${customer.LoyaltyProgramMember === 1 ? 'Yes' : 'No'}
- Status: ${customer.HighSatisfaction === 1 ? 'Satisfied' : 'Dissatisfied'}

OUTPUT FORMAT:
Return ONLY a valid JSON object matching this exact schema:
{
  "retention_risk_level": "CRITICAL" | "HIGH" | "MODERATE",
  "failure_point": "<Under 8 words summary of primary operational failure>",
  "metrics_analysis": [
    "<Punchy observation 1: Impact of wait time and ratings conflict>",
    "<Punchy observation 2: Revenue risk considering spend and visit pattern>"
  ],
  "internal_corrective_actions": [
    "<Immediate action for shift supervisor / floor>",
    "<Kitchen or system process correction>"
  ],
  "retention_action": "<Single concrete recovery action with exact dollar or voucher value>"
}
`;

    let jsonResult = null;

    if (ai) {
      const primaryModel = resolveGeminiModel();
      const candidateModels = Array.from(new Set([primaryModel, 'gemini-3.5-flash', 'gemini-3.7-flash', 'gemini-flash-latest']));

      for (const modelToTry of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: modelToTry,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              temperature: 0.1,
            },
          });

          const text = response.text;
          if (text) {
            jsonResult = JSON.parse(text);
            break;
          }
        } catch (apiError: any) {
          console.warn(`[DineIntellect] Model ${modelToTry} attempt notice:`, apiError?.message || apiError);
        }
      }
    }

    if (!jsonResult) {
      console.warn('[DineIntellect] Using deterministic fallback for diagnosis');
      const isCritical = customer.WaitTime > 35 || customer.ServiceRating <= 2 || customer.FoodRating <= 2;
      
      jsonResult = {
        retention_risk_level: isCritical ? "CRITICAL" : "HIGH",
        failure_point: customer.ServiceRating <= 2 
          ? "Front-of-House Service Breakdown" 
          : customer.WaitTime > 25 
          ? "Excessive Order & Expediting Delay" 
          : "Substandard Food Quality Consistency",
        metrics_analysis: [
          `Wait time of ${waitMins}m with Service rating ${customer.ServiceRating}/5 directly triggered dissatisfaction.`,
          `Average spend of $${avgSpend} flags this patron as an immediate recovery priority.`
        ],
        internal_corrective_actions: [
          "Audit FOH station coverage and table check-in frequency during peak shifts.",
          "Cap takeaway prep and ticket turnaround strictly under 15 minutes."
        ],
        retention_action: `Issue an immediate $20 credit toward their next ${customer.PreferredCuisine} order.`
      };
    }

    return NextResponse.json({ success: true, result: jsonResult });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to diagnose' }, { status: 500 });
  }
}