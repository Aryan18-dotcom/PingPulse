import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Project from '@/models/Project';
import Settings from '@/models/Settings';
import { sendTelegramNotification, sendEmailNotification } from '@/lib/notifier';

export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  await connectDB();
  const projects = await Project.find({ isActive: true });
  const now = new Date();

  const dueProjects = projects.filter((project) => {
    if (!project.lastChecked) return true;
    const elapsedMinutes = (now - new Date(project.lastChecked)) / (1000 * 60);
    return elapsedMinutes >= (project.pingInterval || 10);
  });

  const results = await Promise.allSettled(
    dueProjects.map(async (project) => {
      const startTime = Date.now();
      let status = 500;
      let success = false;
      let errorMessage = null;

      try {
        const response = await fetch(project.url, {
          headers: { 'User-Agent': 'PingPulse-Engine/1.0' },
          signal: AbortSignal.timeout(10000),
        });

        status = response.status;
        success = response.ok;
      } catch (err) {
        errorMessage = err.message || 'Connection Timeout';
      }

      const duration = Date.now() - startTime;
      const wasDown = project.isDown;
      const nowIsDown = !success;

      // Fetch the specific user's notification settings
      const userSettings = await Settings.findOne({ userId: project.userId }) || {};

      // 🚨 SITE DOWN ALERT
      if (nowIsDown && !wasDown) {
        const telegramMsg = `🚨 <b>Site Down Alert!</b>\n\n` +
          `<b>Project:</b> ${project.name}\n` +
          `<b>URL:</b> ${project.url}\n` +
          `<b>Status:</b> ${status}\n` +
          `<b>Error:</b> ${errorMessage || 'HTTP Error'}\n` +
          `<b>Time:</b> ${now.toLocaleString()}`;

        const emailSubject = `🚨 [PingPulse Alert] ${project.name} is DOWN!`;
        const emailBody = `
          <div style="font-family: sans-serif; padding: 20px; background: #111; color: #fff;">
            <h2 style="color: #ef4444;">🚨 Site Down Alert</h2>
            <p><strong>Project:</strong> ${project.name}</p>
            <p><strong>URL:</strong> <a href="${project.url}" style="color: #38bdf8;">${project.url}</a></p>
            <p><strong>Status:</strong> ${status}</p>
            <p><strong>Error:</strong> ${errorMessage || 'HTTP Error'}</p>
            <p><strong>Time:</strong> ${now.toLocaleString()}</p>
          </div>
        `;

        const alertPromises = [];
        if (project.notifyTelegram) alertPromises.push(sendTelegramNotification(userSettings, telegramMsg));
        if (project.notifyEmail) alertPromises.push(sendEmailNotification(userSettings, emailSubject, emailBody));
        await Promise.all(alertPromises);
      }

      // 🟢 SITE RECOVERED ALERT
      if (!nowIsDown && wasDown) {
        const recoveryMsg = `✅ <b>Site Restored!</b>\n\n` +
          `<b>Project:</b> ${project.name}\n` +
          `<b>URL:</b> ${project.url}\n` +
          `<b>Status:</b> ${status} OK\n` +
          `<b>Latency:</b> ${duration}ms\n` +
          `<b>Time:</b> ${now.toLocaleString()}`;

        const emailSubject = `✅ [PingPulse Alert] ${project.name} is RESTORED!`;
        const emailBody = `
          <div style="font-family: sans-serif; padding: 20px; background: #111; color: #fff;">
            <h2 style="color: #10b981;">✅ Site Restored</h2>
            <p><strong>Project:</strong> ${project.name}</p>
            <p><strong>URL:</strong> <a href="${project.url}" style="color: #38bdf8;">${project.url}</a></p>
            <p><strong>Status:</strong> ${status} OK</p>
            <p><strong>Latency:</strong> ${duration}ms</p>
            <p><strong>Time:</strong> ${now.toLocaleString()}</p>
          </div>
        `;

        const alertPromises = [];
        if (project.notifyTelegram) alertPromises.push(sendTelegramNotification(userSettings, recoveryMsg));
        if (project.notifyEmail) alertPromises.push(sendEmailNotification(userSettings, emailSubject, emailBody));
        await Promise.all(alertPromises);
      }

      await Project.findByIdAndUpdate(project._id, {
        lastChecked: now,
        lastStatus: status,
        lastResponseTimeMs: duration,
        isDown: nowIsDown,
      });

      return { name: project.name, status, duration, success };
    })
  );

  return NextResponse.json({
    timestamp: now.toISOString(),
    totalMonitored: projects.length,
    pingsExecuted: dueProjects.length,
    results: results.map((r) => r.value || r.reason),
  });
}