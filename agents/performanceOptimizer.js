import { callClaude, calculateTokenCost } from '../config/anthropic.js';
import logger from '../utils/logger.js';

/**
 * AGENT #6: PERFORMANCE OPTIMIZER (PRO ONLY)
 * Apprend des conversions et optimise continuellement les agents
 * 
 * Input: Historique de performances + conversions
 * Output: Recommandations d'optimisation spécifiques
 * Tokens: ~40 tokens par analyse
 */

export async function performanceOptimizerAgent(performanceData, conversions) {
  try {
    logger.info('🚀 Performance Optimizer agent started', {
      totalMessages: performanceData.total_messages_sent,
      conversionRate: performanceData.conversion_rate
    });

    const prompt = `Tu es un expert en optimisation de prospection. Analyse les données de performance et propose des améliorations spécifiques.

DONNÉES DE PERFORMANCE:
${JSON.stringify(performanceData, null, 2)}

HISTORIQUE DE CONVERSIONS:
${JSON.stringify(conversions.slice(0, 10), null, 2)}

Analyse PRÉCISÉMENT:
1. Quel type de message fonctionne le mieux?
2. Quel angle de prospection génère plus de réponses?
3. Quel jour/heure envoyer?
4. Quels prospects sont plus réceptifs?
5. Quels sont les patterns de conversion?

RÉPONDS UNIQUEMENT EN JSON:
{
  "current_performance": {
    "conversion_rate": "X%",
    "average_response_time_hours": 24,
    "best_performing_angle": "angle X",
    "worst_performing_angle": "angle Y"
  },
  "optimizations": {
    "message_improvements": {
      "recommended_changes": ["change 1", "change 2"],
      "expected_improvement": "+5-10%",
      "specific_example": "exemple concret"
    },
    "angle_optimization": {
      "best_angles": ["angle 1", "angle 2"],
      "angles_to_drop": ["angle"],
      "new_angles_to_test": ["angle"]
    },
    "timing_optimization": {
      "best_day_of_week": "Tuesday",
      "best_time_of_day": "09:00-11:00",
      "avoid_times": ["18:00-08:00"]
    },
    "prospect_segmentation": {
      "high_value_segment": "caractéristiques",
      "quick_responders": "caractéristiques",
      "hard_to_reach": "caractéristiques"
    }
  },
  "predictions": {
    "predicted_conversion_rate_after_changes": "25-35%",
    "expected_rdv_increase": "+30%",
    "confidence": "75-85%"
  },
  "action_plan": [
    {
      "priority": 1,
      "action": "action 1",
      "expected_impact": "impact",
      "effort": "low|medium|high",
      "timeline": "1 week"
    }
  ],
  "ab_tests_to_run": [
    {
      "test_name": "test name",
      "control": "version de contrôle",
      "variant": "version test",
      "sample_size": 50,
      "duration_days": 7
    }
  ]
}`;

    const response = await callClaude([
      {
        role: 'user',
        content: prompt
      }
    ], {
      temperature: 0.6
    });

    // Parse JSON response
    let result;
    try {
      result = JSON.parse(response.content);
    } catch (error) {
      logger.warn('Failed to parse Claude response');
      result = {
        raw_response: response.content,
        error: 'Could not parse JSON'
      };
    }

    // Calculate cost
    const cost = calculateTokenCost(response.tokens.input, response.tokens.output);

    logger.info('✅ Performance Optimizer agent completed', {
      tokensUsed: response.tokens.total,
      cost: `$${cost.toFixed(6)}`
    });

    return {
      success: true,
      agent: 'performance-optimizer',
      data: result,
      tokens: {
        used: response.tokens.total,
        cost: cost
      }
    };

  } catch (error) {
    logger.error('❌ Performance Optimizer agent error:', error);
    return {
      success: false,
      agent: 'performance-optimizer',
      error: error.message
    };
  }
}

/**
 * Helper: Calculate conversion rate
 */
export function calculateConversionRate(messages, conversions) {
  if (messages === 0) return 0;
  return ((conversions / messages) * 100).toFixed(2);
}

/**
 * Helper: Identify best performing angle
 */
export function identifyBestAngle(performanceByAngle) {
  return Object.entries(performanceByAngle).reduce((best, [angle, data]) => {
    if (!best || data.conversion_rate > best.rate) {
      return { angle, rate: data.conversion_rate };
    }
    return best;
  });
}

/**
 * Helper: Generate AB test config
 */
export function generateABTest(controlVersion, variantVersion, sampleSize = 50) {
  return {
    id: `ab_test_${Date.now()}`,
    control: controlVersion,
    variant: variantVersion,
    sampleSize: sampleSize,
    startDate: new Date(),
    duration: 7,
    status: 'pending'
  };
}
