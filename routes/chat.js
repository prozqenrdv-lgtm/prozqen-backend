import express from 'express';
import { callClaude } from '../config/anthropic.js';

import { authenticateToken } from './auth.js';

const router = express.Router();

// Store conversation history in memory (use Redis in production)
const conversationHistory = new Map();

/**
 * POST /chat/message
 * Send message to AI chatbot
 */
router.post('/message', authenticateToken, async (req, res) => {
  try {
    const { message, conversationId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message required' });
    }

    const convId = conversationId || `conv_${req.user.userId}_${Date.now()}`;

    // Get or create conversation history
    if (!conversationHistory.has(convId)) {
      conversationHistory.set(convId, []);
    }

    const history = conversationHistory.get(convId);

    // Add user message to history
    history.push({
      role: 'user',
      content: message
    });

    // Call Claude API
    const systemPrompt = `Tu es un assistant support PROZQEN expert en prospection immobilière.
Tu aides les utilisateurs avec:
- Questions sur les agents IA
- Configuration de campagnes
- Interprétation des résultats
- Best practices de prospection
- Dépannage technique

Sois professionnel, concis et actionnable.`;

    const response = await callClaude(history, {
      system: systemPrompt,
      temperature: 0.7
    });

    // Add assistant response to history
    history.push({
      role: 'assistant',
      content: response.content
    });

    // Keep last 20 messages for context
    if (history.length > 20) {
      conversationHistory.set(convId, history.slice(-20));
    }

    console.log('Chat message processed', {
      userId: req.user.userId,
      convId: convId.substring(0, 20) + '...',
      tokensUsed: response.tokens.total
    });

    res.json({
      success: true,
      conversationId: convId,
      response: response.content,
      tokens: {
        used: response.tokens.total
      }
    });

  } catch (error) {
    console.error('Chat message error:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

/**
 * GET /chat/conversations
 * List user conversations
 */
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const userConvs = Array.from(conversationHistory.keys())
      .filter(id => id.includes(req.user.userId))
      .slice(0, 10);

    res.json({
      success: true,
      conversations: userConvs.map(id => ({
        id: id,
        messagesCount: conversationHistory.get(id).length
      }))
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
});

export default router;
