const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Client = require('../models/Client');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';
const FALLBACK_MODEL = 'gemini-2.5-flash';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function generate(prompt, system) {
  const config = system ? { systemInstruction: system } : undefined;
  const models = [MODEL, FALLBACK_MODEL];
  let lastErr;
  for (const model of models) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await ai.models.generateContent({ model, contents: prompt, config });
        return response.text;
      } catch (e) {
        lastErr = e;
        const msg = e.message || '';
        // Retry on transient overload; break to fallback model otherwise
        if (msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('overloaded')) {
          await sleep(800 * (attempt + 1));
          continue;
        }
        break;
      }
    }
  }
  throw lastErr;
}

// AI status report / summary for a project
router.post('/summarize', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.body;
    const project = await Project.findById(projectId).populate('clientId', 'name company');
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const tasks = await Task.find({ projectId });
    const done = tasks.filter((t) => t.status === 'done').length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const todo = tasks.filter((t) => t.status === 'todo').length;

    const prompt = `Write a concise, professional project status report for the client.
Project: ${project.name}
Client: ${project.clientId?.name || 'N/A'}
Status: ${project.status}
Progress: ${project.progress}%
Deadline: ${project.deadline ? new Date(project.deadline).toDateString() : 'Not set'}
Description: ${project.description || 'N/A'}
Tasks: ${tasks.length} total (${done} done, ${inProgress} in progress, ${todo} to do).
Task list: ${tasks.map((t) => `- ${t.title} [${t.status}]`).join('\n')}

Produce 3 short sections: "Summary", "Recent Progress", and "Next Steps". Keep it under 200 words, business tone, no markdown headers with #, use plain short paragraphs with bold labels.`;

    const text = await generate(
      prompt,
      'You are a senior project manager at a premium software agency. You write clear, confident status updates.'
    );
    res.json({ text });
  } catch (e) {
    res.status(500).json({ error: e.message || 'AI generation failed' });
  }
});

// Generate tasks from a project brief. Optionally persist them.
router.post('/generate-tasks', requireAuth, requireRole('admin', 'team'), async (req, res) => {
  try {
    const { projectId, brief, persist } = req.body;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const prompt = `Break the following software project brief into a list of actionable tasks.
Project: ${project.name}
Brief: ${brief || project.description}

Return ONLY valid JSON, an array of objects with keys: "title" (string), "priority" ("low"|"medium"|"high"). Provide between 5 and 8 tasks. No commentary, no markdown fences.`;

    let text = await generate(
      prompt,
      'You are a technical lead who decomposes projects into precise engineering tasks. You always respond with strict JSON only.'
    );
    text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    let tasks = [];
    try {
      tasks = JSON.parse(text);
    } catch (err) {
      const match = text.match(/\[[\s\S]*\]/);
      if (match) tasks = JSON.parse(match[0]);
    }
    tasks = (tasks || [])
      .filter((t) => t && t.title)
      .map((t) => ({
        title: String(t.title).slice(0, 200),
        priority: ['low', 'medium', 'high'].includes(t.priority) ? t.priority : 'medium',
      }));

    let created = [];
    if (persist && tasks.length) {
      created = await Task.insertMany(
        tasks.map((t) => ({ ...t, projectId, status: 'todo' }))
      );
    }
    res.json({ tasks, created });
  } catch (e) {
    res.status(500).json({ error: e.message || 'AI generation failed' });
  }
});

// Draft a client communication email
router.post('/draft-email', requireAuth, requireRole('admin', 'team'), async (req, res) => {
  try {
    const { projectId, purpose, tone } = req.body;
    let context = '';
    if (projectId) {
      const project = await Project.findById(projectId).populate('clientId', 'name');
      if (project)
        context = `Project: ${project.name}, Client: ${project.clientId?.name || ''}, Status: ${project.status}, Progress: ${project.progress}%.`;
    }
    const prompt = `Draft a professional email to a client.
Purpose: ${purpose}
Tone: ${tone || 'professional and friendly'}
${context}

Return the email with a "Subject:" line first, then the body. Keep it concise and ready to send.`;
    const text = await generate(
      prompt,
      'You are an account manager at a premium software agency writing polished client emails.'
    );
    res.json({ text });
  } catch (e) {
    res.status(500).json({ error: e.message || 'AI generation failed' });
  }
});

module.exports = router;
