/**
 * Build HTML email template for interview performance report
 */
const buildEmailHTML = (interview, resume, user) => {
    const scoreColor = (score) => {
        if (score >= 80) return '#10b981';
        if (score >= 60) return '#f59e0b';
        return '#ef4444';
    };

    const qaRows = (interview.questionAnswers || [])
        .map(
            (qa, i) => `
      <tr style="background:${i % 2 === 0 ? '#1e293b' : '#0f172a'}">
        <td style="padding:12px;color:#94a3b8;font-size:13px;">Q${i + 1}: ${qa.question?.question || 'N/A'}</td>
        <td style="padding:12px;text-align:center;font-weight:bold;color:${scoreColor(qa.score?.overall || 0)}">${qa.score?.overall || 0}/100</td>
        <td style="padding:12px;color:#cbd5e1;font-size:12px;">${qa.score?.feedback || 'N/A'}</td>
      </tr>`
        )
        .join('');

    const resumeSection = resume
        ? `
    <div style="background:#1e293b;border-radius:12px;padding:24px;margin-top:24px;">
      <h2 style="color:#818cf8;margin:0 0 16px;">📄 Resume ATS Analysis</h2>
      <div style="display:flex;gap:16px;flex-wrap:wrap;">
        <div style="flex:1;min-width:200px;background:#0f172a;border-radius:8px;padding:16px;text-align:center;">
          <div style="font-size:48px;font-weight:bold;color:${scoreColor(resume.atsScore)}">${resume.atsScore}</div>
          <div style="color:#64748b;font-size:12px;margin-top:4px;">ATS Score</div>
        </div>
        <div style="flex:2;min-width:200px;">
          <p style="color:#10b981;margin:0 0 6px;font-size:13px;font-weight:600;">✅ Matched Skills:</p>
          <p style="color:#94a3b8;font-size:12px;margin:0 0 12px;">${(resume.matchedSkills || []).join(', ') || 'None'}</p>
          <p style="color:#ef4444;margin:0 0 6px;font-size:13px;font-weight:600;">❌ Missing Skills:</p>
          <p style="color:#94a3b8;font-size:12px;margin:0;">${(resume.missingSkills || []).join(', ') || 'None'}</p>
        </div>
      </div>
      <div style="margin-top:16px;">
        <p style="color:#f59e0b;font-size:13px;font-weight:600;margin:0 0 8px;">💡 Suggestions:</p>
        <ul style="color:#94a3b8;font-size:12px;margin:0;padding-left:20px;">
          ${(resume.suggestions || []).map((s) => `<li style="margin-bottom:4px;">${s}</li>`).join('')}
        </ul>
      </div>
    </div>`
        : '';

    return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>AI Interview Report</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f172a;margin:0;padding:24px;">
  <div style="max-width:800px;margin:0 auto;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:16px;padding:32px;text-align:center;margin-bottom:24px;">
      <h1 style="color:#fff;margin:0;font-size:28px;">🎯 AI Interview Performance Report</h1>
      <p style="color:#c4b5fd;margin:8px 0 0;">Generated for ${user?.name || 'Candidate'}</p>
    </div>

    <!-- Summary Cards -->
    <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:24px;">
      <div style="flex:1;min-width:160px;background:#1e293b;border-radius:12px;padding:20px;text-align:center;border:1px solid #334155;">
        <div style="font-size:42px;font-weight:bold;color:${scoreColor(interview.overallScore)}">${interview.overallScore}</div>
        <div style="color:#64748b;font-size:12px;margin-top:4px;">Overall Score</div>
      </div>
      <div style="flex:1;min-width:160px;background:#1e293b;border-radius:12px;padding:20px;text-align:center;border:1px solid #334155;">
        <div style="font-size:22px;font-weight:bold;color:#818cf8;">${interview.role}</div>
        <div style="color:#64748b;font-size:12px;margin-top:4px;">Role</div>
      </div>
      <div style="flex:1;min-width:160px;background:#1e293b;border-radius:12px;padding:20px;text-align:center;border:1px solid #334155;">
        <div style="font-size:22px;font-weight:bold;color:#34d399;text-transform:capitalize;">${interview.experienceLevel}</div>
        <div style="color:#64748b;font-size:12px;margin-top:4px;">Level</div>
      </div>
      <div style="flex:1;min-width:160px;background:#1e293b;border-radius:12px;padding:20px;text-align:center;border:1px solid #334155;">
        <div style="font-size:22px;font-weight:bold;color:#f59e0b;">${interview.questionAnswers?.length || 0}</div>
        <div style="color:#64748b;font-size:12px;margin-top:4px;">Questions</div>
      </div>
    </div>

    <!-- Q&A Breakdown -->
    <div style="background:#1e293b;border-radius:12px;padding:24px;margin-bottom:24px;">
      <h2 style="color:#818cf8;margin:0 0 16px;">📊 Question-wise Breakdown</h2>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#334155;">
            <th style="padding:12px;text-align:left;color:#94a3b8;font-size:12px;font-weight:600;">Question</th>
            <th style="padding:12px;text-align:center;color:#94a3b8;font-size:12px;font-weight:600;">Score</th>
            <th style="padding:12px;text-align:left;color:#94a3b8;font-size:12px;font-weight:600;">Feedback</th>
          </tr>
        </thead>
        <tbody>${qaRows}</tbody>
      </table>
    </div>

    ${resumeSection}

    <!-- Footer -->
    <div style="text-align:center;margin-top:24px;color:#475569;font-size:12px;">
      <p>Generated by <strong style="color:#818cf8;">AI Voice Interview System</strong> • ${new Date().toLocaleDateString()}</p>
    </div>
  </div>
</body>
</html>`;
};

module.exports = { buildEmailHTML };
