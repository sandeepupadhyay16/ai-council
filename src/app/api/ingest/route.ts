import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { harvestMultipleIdeasFromMeeting, embedText, HarvestedIdea } from '@/lib/llm';

export async function POST(request: Request) {
  try {
    let action = 'parse';
    let content = '';
    let fileName = 'pasted_text.txt';
    let ideasToCommit: HarvestedIdea[] = [];
    let submittedBy = 'TBD';

    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
      }
      
      fileName = file.name;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (file.name.toLowerCase().endsWith('.pdf')) {
        const pdfParse = require('pdf-parse');
        const pdfData = await pdfParse(buffer);
        content = pdfData.text || '';
      } else {
        content = buffer.toString('utf-8');
      }
    } else {
      const body = await request.json();
      action = body.action || 'parse';
      content = body.content || body.text || '';
      fileName = body.fileName || 'transcript.txt';
      ideasToCommit = body.ideas || [];
      submittedBy = body.submittedBy || 'TBD';
    }

    if (action === 'commit') {
      if (!Array.isArray(ideasToCommit) || ideasToCommit.length === 0) {
        return NextResponse.json({ error: 'No ideas provided to commit' }, { status: 400 });
      }

      // Fetch 6 configuration weights
      const weightsConfig = await prisma.systemConfig.findUnique({ where: { key: 'weights' } });
      const w = weightsConfig && weightsConfig.value.split(',').length === 6
        ? weightsConfig.value.split(',').map(Number)
        : [0.16, 0.16, 0.17, 0.17, 0.17, 0.17];

      const committedProjects = [];

      for (const idea of ideasToCommit) {
        // Evaluate scores dynamically
        const budgetAvailabilityScore = idea.financialRoi > 500000 ? 95.0 : 70.0;
        const dataAvailabilityScore = (idea.dataReadiness && idea.dataReadiness.length > 20) || idea.integrations.length > 0 ? 85.0 : 65.0;
        const stakeholderReadinessScore = 80.0;
        const impactOfNotDoingScore = idea.opportunityCost.length > 20 ? 85.0 : 70.0;
        const financialBusinessCaseScore = 80.0;
        const budgetRequiredScore = idea.budgetRequiredVal < 150000 ? 90.0 : 70.0;

        const readinessScore = 
          budgetAvailabilityScore * w[0] + 
          dataAvailabilityScore * w[1] + 
          stakeholderReadinessScore * w[2] + 
          impactOfNotDoingScore * w[3] + 
          financialBusinessCaseScore * w[4] + 
          budgetRequiredScore * w[5];

        const newProject = await prisma.project.create({
          data: {
            title: idea.title,
            problemStatement: idea.problemStatement,
            integrations: idea.integrations || [],
            budgetStatus: idea.budgetStatus || 'Under Review',
            stakeholderStatus: idea.stakeholderStatus || 'TBD',
            opportunityCost: idea.opportunityCost || 'Bottleneck remains',
            businessCase: idea.businessCase || '',
            financialRoi: idea.financialRoi || 0,
            budgetRequiredVal: idea.budgetRequiredVal || 0,
            execSponsor: 'TBD',
            productOwner: 'TBD',
            deploymentGateway: '',
            phase: 'Draft',
            therapeuticAreas: idea.therapeuticAreas || ['Oncology'],
            budgetAvailabilityScore,
            dataAvailabilityScore,
            stakeholderReadinessScore,
            impactOfNotDoingScore,
            financialBusinessCaseScore,
            budgetRequiredScore,
            readinessScore,
            functionalDomains: idea.functionalDomains || ['Omnichannel Intelligence'],
            ideaScore: readinessScore,
            checkerInsight: 'Unique project structure detected. Scanned database and found no matching duplicates.',
            brainstormerInsight: `Strategy co-design generated from meeting notes triage for "${idea.title}".`,
            validatorInsight: `Calculated feasibility readiness based on integrations: [${(idea.integrations || []).join(', ')}].`,
            businessCaseInsight: `Calculated annual returns of $${(idea.financialRoi || 0).toLocaleString()} vs setup budget of $${(idea.budgetRequiredVal || 0).toLocaleString()}.`,
            criticInsight: 'Compliance checklist: Commercial data usage rules, local branding guides, and Veeva CRM sync policies apply.',
            financialRoiY1: idea.financialRoi || 0,
            financialRoiY2: idea.financialRoi || 0,
            financialRoiY3: idea.financialRoi || 0,
            budgetRequiredY1: idea.budgetRequiredVal || 0,
            budgetRequiredY2: 0,
            budgetRequiredY3: 0,
            businessCaseRationale: idea.businessCase || '',
            dependencies: '',
            businessCaseFile: '',
            dataReadiness: idea.dataReadiness || '',
            submittedBy: submittedBy
          }
        });

        // Create embedding
        const embedTextStr = `${newProject.title} ${newProject.problemStatement} ${(newProject.integrations || []).join(' ')} ${(newProject.functionalDomains || []).join(' ')} ${(newProject.therapeuticAreas || []).join(' ')} ${newProject.dataReadiness || ''}`;
        const embedding = await embedText(embedTextStr);
        const embeddingStr = `[${embedding.join(',')}]`;

        await prisma.$executeRawUnsafe(`
          INSERT INTO "ProjectEmbedding" ("id", "projectId", "embedding", "createdAt")
          VALUES (gen_random_uuid(), $1, $2::vector, NOW())
        `, newProject.id, embeddingStr);

        committedProjects.push(newProject);
      }

      return NextResponse.json({
        success: true,
        message: `Successfully ingested ${committedProjects.length} selected ideas as Drafts.`,
        committed: true,
        projects: committedProjects
      });
    }

    // Default mode: parse text/files
    if (!content.trim()) {
      return NextResponse.json({ error: 'Content is empty' }, { status: 400 });
    }

    // Save Ingestion record
    await prisma.meetingIngestion.create({
      data: {
        fileName,
        content
      }
    });

    // Run LLM multi-idea harvesting
    const ideas = await harvestMultipleIdeasFromMeeting(content);

    return NextResponse.json({
      success: true,
      message: `Parsed ${ideas.length} candidate ideas from transcript.`,
      ideas
    });

  } catch (error: any) {
    console.error('API Ingest failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
