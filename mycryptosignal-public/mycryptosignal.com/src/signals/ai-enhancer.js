// Layer B: AI enhancement layer (summarizer and classifier)
// Takes Layer A output and adds context, adjusts confidence within bounds
// Uses Cohere AI

export class AIEnhancer {
  constructor(apiKey, model = null) {
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = 'https://api.cohere.ai/v1/chat';
  }

  /**
   * Enhance a single signal with AI context
   * AI can only refine explanation and slightly adjust confidence (±5 points max)
   */
  async enhanceSignal(signal, coinName) {
    try {
      const userPrompt = `You are a crypto trading signal analyst. Review this deterministic signal and provide a concise enhancement.

Coin: ${coinName}
Action: ${signal.action}
Confidence: ${signal.confidence}%
Metrics: ${JSON.stringify(signal.metrics)}
Initial Explanation: ${signal.explanation}

Rules:
1. You CANNOT change the action (${signal.action})
2. You can adjust confidence by max ±5 points (range: ${signal.confidence - 5} to ${signal.confidence + 5})
3. Provide a brief, clear explanation (1-2 sentences max)
4. Focus on the 1-7 day outlook
5. Be neutral and informational, not promotional

Return JSON only:
{
  "confidence": <adjusted number>,
  "explanation": "<your explanation>"
}`;

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({

          message: userPrompt,
          preamble: 'You are a precise crypto signal analyst. Output JSON only.',
          temperature: 0.3,
          max_tokens: 150,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Cohere AI API error: ${response.status} - ${error.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const content = data.text.trim();
      
      // Parse JSON response
      const enhanced = JSON.parse(content);

      // Enforce confidence bounds
      const minConf = signal.confidence - 5;
      const maxConf = signal.confidence + 5;
      enhanced.confidence = Math.max(minConf, Math.min(maxConf, enhanced.confidence));

      return {
        confidence: Math.round(enhanced.confidence),
        explanation: enhanced.explanation,
        aiAdjustment: enhanced.confidence - signal.confidence
      };

    } catch (error) {
      console.error('AI enhancement error:', error.message);
      // Fallback to original signal if AI fails
      return {
        confidence: signal.confidence,
        explanation: signal.explanation,
        aiAdjustment: 0,
        error: error.message
      };
    }
  }

  /**
   * Enhance multiple signals (batch processing with rate limiting)
   * Cohere allows 100 req/min, so we can process larger batches
   */
  async enhanceSignals(signals) {
    const enhanced = [];
    
    // Process in batches to respect Cohere rate limits (100 req/min)
    const batchSize = 10;
    for (let i = 0; i < signals.length; i += batchSize) {
      const batch = signals.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(
        batch.map(signal => 
          this.enhanceSignal(signal, signal.coin_name || signal.symbol)
        )
      );

      enhanced.push(...batchResults);

      // Small delay between batches to avoid rate limits
      if (i + batchSize < signals.length) {
        await new Promise(resolve => setTimeout(resolve, 700));
      }
    }

    return enhanced;
  }

  /**
   * Update signals in database with AI enhancements
   */
  async updateSignalsWithAI(db, signalDate) {
    try {
      // Get today's signals
      const { results: signals } = await db.prepare(
        `SELECT s.*, c.name, c.symbol 
         FROM signals s
         JOIN coins c ON s.coin_id = c.id
         WHERE s.signal_date = ? AND s.layer_b_adjustment IS NULL`
      ).bind(signalDate).all();

      if (signals.length === 0) {
        return { success: true, count: 0, message: 'No signals to enhance' };
      }

      // Enhance with AI
      const enhancements = await this.enhanceSignals(
        signals.map(s => ({
          action: s.action,
          confidence: s.confidence,
          explanation: s.explanation,
          metrics: JSON.parse(s.layer_a_data),
          coin_name: s.name,
          symbol: s.symbol
        }))
      );

      // Update database
      for (let i = 0; i < signals.length; i++) {
        const signal = signals[i];
        const enhanced = enhancements[i];

        await db.prepare(
          `UPDATE signals 
           SET confidence = ?, 
               explanation = ?, 
               layer_b_adjustment = ?
           WHERE id = ?`
        ).bind(
          enhanced.confidence,
          enhanced.explanation,
          JSON.stringify({ aiAdjustment: enhanced.aiAdjustment }),
          signal.id
        ).run();
      }

      return { 
        success: true, 
        count: signals.length,
        message: `Enhanced ${signals.length} signals with AI`
      };

    } catch (error) {
      console.error('AI enhancement batch error:', error.message);
      console.log('Continuing without AI enhancement - signals will use deterministic values only');
      return { 
        success: false, 
        error: error.message,
        message: 'AI enhancement failed, signals generated with Layer A only'
      };
    }
  }
}
