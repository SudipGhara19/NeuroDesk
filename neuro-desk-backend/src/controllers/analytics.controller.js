const User = require('../models/user.model');
const UserData = require('../models/userData.model');
const Document = require('../models/document.model');
const AiChat = require('../models/ai-chat.model');
const Groq = require('groq-sdk');

let _groq = null;
const getGroq = () => {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return _groq;
};

// @desc    Get aggregated system analytics
// @route   GET /api/analytics/system
// @access  Private/Admin/Manager
const getSystemAnalytics = async (req, res, next) => {
  try {
    // 1. User Metrics
    const activeUsersCount = await User.countDocuments({ isActive: true });
    
    // Aggregate by role
    const roleDistribution = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);
    const roles = { Admin: 0, Manager: 0, User: 0 };
    roleDistribution.forEach(r => { roles[r._id] = r.count; });
    const totalUsers = roles.Admin + roles.Manager + roles.User;

    // 2. AI Usage & Cost (from UserData)
    const usageAggregate = await UserData.aggregate([
      {
        $group: {
          _id: null,
          totalQueries: { $sum: '$stats.totalQueries' },
          totalTokens: { $sum: '$stats.totalTokensUsed' },
          totalCost: { $sum: '$stats.totalCostEstimate' },
          avgLatency: { $avg: '$stats.avgLatencyMs' }
        }
      }
    ]);
    const usage = usageAggregate[0] || { 
      totalQueries: 0, totalTokens: 0, totalCost: 0, avgLatency: 0 
    };

    // 3. Knowledge Base Metrics (from Document)
    const docAggregate = await Document.aggregate([
      {
        $group: {
          _id: null,
          totalDocs: { $sum: 1 },
          totalStorageBytes: { $sum: '$fileSize' },
          totalChunks: { $sum: '$chunkCount' }
        }
      }
    ]);
    const docs = docAggregate[0] || { totalDocs: 0, totalStorageBytes: 0, totalChunks: 0 };

    // Group documents by type
    const docTypeDistribution = await Document.aggregate([
      { $group: { _id: '$fileType', count: { $sum: 1 } } }
    ]);
    const docTypes = {};
    docTypeDistribution.forEach(d => { docTypes[d._id] = d.count; });

    // Document processing status
    const docStatusDistribution = await Document.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const docStatus = {};
    docStatusDistribution.forEach(d => { docStatus[d._id] = d.count; });

    // 4. Chat Sessions Metrics
    const chatAggregate = await AiChat.aggregate([
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          totalMessages: { $sum: '$stats.totalMessages' }
        }
      }
    ]);
    const chats = chatAggregate[0] || { totalSessions: 0, totalMessages: 0 };

    // Recent query volumes (aggregation of daily/weekly/monthly from all users)
    const queryFreqAggregate = await UserData.aggregate([
      {
        $group: {
          _id: null,
          daily: { $sum: '$analytics.queryFrequency.daily' },
          weekly: { $sum: '$analytics.queryFrequency.weekly' },
          monthly: { $sum: '$analytics.queryFrequency.monthly' }
        }
      }
    ]);
    const queryFreq = queryFreqAggregate[0] || { daily: 0, weekly: 0, monthly: 0 };
    delete queryFreq._id;

    res.json({
      users: {
        total: totalUsers,
        active: activeUsersCount,
        inactive: totalUsers - activeUsersCount,
        byRole: roles
      },
      aiUsage: {
        totalQueries: usage.totalQueries,
        totalTokens: usage.totalTokens,
        totalCostEstimate: usage.totalCost.toFixed(4),
        avgLatencyMs: Math.round(usage.avgLatency),
        queryFrequency: queryFreq
      },
      knowledgeBase: {
        totalDocuments: docs.totalDocs,
        totalStorageBytes: docs.totalStorageBytes,
        totalChunks: docs.totalChunks,
        byType: docTypes,
        byStatus: docStatus
      },
      chatSessions: {
        total: chats.totalSessions,
        totalMessages: chats.totalMessages
      }
    });

  } catch (error) {
    console.error('[System Analytics] Error aggregating data:', error);
    next(error);
  }
};

// @desc    Analyze aggregate system data via Groq LLM
// @route   POST /api/analytics/system/analyze
// @access  Private/Admin/Manager
const analyzeSystemHealth = async (req, res, next) => {
  try {
    // 1. Gather same metrics as above (we could extract this to a helper function, but repeating it here for simplicity)
    const activeUsersCount = await User.countDocuments({ isActive: true });
    
    const roleDistribution = await User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]);
    const roles = { Admin: 0, Manager: 0, User: 0 };
    roleDistribution.forEach(r => { roles[r._id] = r.count; });
    const totalUsers = roles.Admin + roles.Manager + roles.User;

    const usageAggregate = await UserData.aggregate([
      {
        $group: {
          _id: null,
          totalQueries: { $sum: '$stats.totalQueries' },
          totalTokens: { $sum: '$stats.totalTokensUsed' },
          totalCost: { $sum: '$stats.totalCostEstimate' },
          avgLatency: { $avg: '$stats.avgLatencyMs' }
        }
      }
    ]);
    const usage = usageAggregate[0] || { totalQueries: 0, totalTokens: 0, totalCost: 0, avgLatency: 0 };

    const docAggregate = await Document.aggregate([
      {
        $group: {
          _id: null,
          totalDocs: { $sum: 1 },
          totalStorageBytes: { $sum: '$fileSize' },
          totalChunks: { $sum: '$chunkCount' }
        }
      }
    ]);
    const docs = docAggregate[0] || { totalDocs: 0, totalStorageBytes: 0, totalChunks: 0 };

    const chatAggregate = await AiChat.aggregate([
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          totalMessages: { $sum: '$stats.totalMessages' }
        }
      }
    ]);
    const chats = chatAggregate[0] || { totalSessions: 0, totalMessages: 0 };

    // 2. Format a system prompt with the data
    const systemPrompt = `You are the Lead Systems Architect & AI Analyst for NeuroDesk.

Your task is to analyze the following platform metrics and generate a concise, actionable "System Health & Optimization Report" in professional Markdown format.

Provide:
1. An Executive Summary (2 sentences max).
2. Key Observations (call out anything noteworthy or anomalous in the token usage, costs, or response times).
3. Optimization Recommendations (suggest actionable technical or architectural improvements based on this specific data).

### RAW METRICS:
Total Users: ${totalUsers} (Active: ${activeUsersCount})
Role Breakdown: Admins (${roles.Admin}), Managers (${roles.Manager}), Users (${roles.User})
Total AI Queries: ${usage.totalQueries}
Total AI Tokens Used: ${usage.totalTokens}
Total Estimated AI Cost: $${Number(usage.totalCost).toFixed(4)}
Average Platform Latency: ${Math.round(usage.avgLatency)}ms
Total Knowledge Base Documents: ${docs.totalDocs}
Vector Database Chunks: ${docs.totalChunks}
Total Storage Used: ${Math.round(docs.totalStorageBytes / 1024 / 1024)} MB
Total AI Chat Sessions: ${chats.totalSessions}
Total AI Chat Messages: ${chats.totalMessages}

Format the response strictly using markdown styling (headers, bullets, bolded terms) without a preamble like "Here is the report".`;

    // 3. Request LLM completion using Llama 3
    const completion = await getGroq().chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Please draft the System Health & Optimization Report.' }
      ],
      temperature: 0.3,
      max_tokens: 1024,
    });

    const reportMarkdown = completion.choices[0].message.content.trim();

    res.json({
      report: reportMarkdown
    });

  } catch (error) {
    console.error('[System Analytics] Error analyzing data via LLM:', error);
    next(error);
  }
};

module.exports = {
  getSystemAnalytics,
  analyzeSystemHealth
};
