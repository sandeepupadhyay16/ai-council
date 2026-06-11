import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { embedText } from '@/lib/llm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (id) {
      const project = await prisma.project.findUnique({
        where: { id }
      });
      return NextResponse.json(project);
    }

    const submittedBy = searchParams.get('submittedBy');
    const phase = searchParams.get('phase');
    const excludePhase = searchParams.get('excludePhase');

    const where: any = {};
    if (submittedBy) {
      where.submittedBy = submittedBy;
    }
    if (phase) {
      where.phase = phase;
    }
    if (excludePhase) {
      const excludedPhases = excludePhase.split(',').map(p => p.trim());
      if (excludedPhases.length > 1) {
        where.phase = {
          notIn: excludedPhases
        };
      } else {
        where.phase = {
          not: excludePhase
        };
      }
    }

    const projects = await prisma.project.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(projects);
  } catch (error: any) {
    console.error('API GET projects failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      title,
      problemStatement,
      integrations,
      budgetStatus,
      stakeholderStatus,
      opportunityCost,
      businessCase,
      financialRoi,
      budgetRequiredVal,
      execSponsor,
      productOwner,
      deploymentGateway,
      phase,
      therapeuticAreas,
      budgetAvailabilityScore,
      dataAvailabilityScore,
      stakeholderReadinessScore,
      impactOfNotDoingScore,
      financialBusinessCaseScore,
      budgetRequiredScore,
      readinessScore,
      functionalDomain,
      functionalDomains,
      ideaScore,
      checkerInsight,
      brainstormerInsight,
      validatorInsight,
      businessCaseInsight,
      criticInsight,
      financialRoiY1,
      financialRoiY2,
      financialRoiY3,
      budgetRequiredY1,
      budgetRequiredY2,
      budgetRequiredY3,
      businessCaseRationale,
      dependencies,
      businessCaseFile,
      submittedBy,
      submittedAt,
      feedback
    } = body;

    const safeString = (val: any, fallback = ''): string => {
      if (val === null || val === undefined) return fallback;
      return String(val);
    };

    const safeFloat = (val: any, fallback = 0.0): number => {
      if (val === null || val === undefined) return fallback;
      const num = Number(val);
      return isNaN(num) ? fallback : num;
    };

    const safeStringArray = (val: any): string[] => {
      if (Array.isArray(val)) return val.map(v => safeString(v)).filter(Boolean);
      if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean);
      return [];
    };

    const finalPhase = safeString(phase, 'Backlog');
    let finalSubmittedAt: Date | null = null;
    if (id) {
      const existingProject = await prisma.project.findUnique({ where: { id } });
      if (existingProject) {
        if ((existingProject.phase === 'Draft' || existingProject.phase === 'Sent Back') && finalPhase === 'Backlog') {
          finalSubmittedAt = new Date();
        } else if (submittedAt) {
          finalSubmittedAt = new Date(submittedAt);
        } else {
          finalSubmittedAt = existingProject.submittedAt;
        }
      }
    } else {
      if (finalPhase === 'Backlog') {
        finalSubmittedAt = new Date();
      } else if (submittedAt) {
        finalSubmittedAt = new Date(submittedAt);
      }
    }

    const finalTitle = safeString(title, 'Untitled Proposal');
    const finalProblem = safeString(problemStatement, 'No problem statement provided.');
    let finalDomains = safeStringArray(functionalDomains);
    if (finalDomains.length === 0) {
      finalDomains = functionalDomain ? [functionalDomain] : ['General Commercial AI'];
    }

    // 3-year mapping with single-year fallback
    const fRoiY1 = financialRoiY1 !== undefined ? safeFloat(financialRoiY1) : (safeFloat(financialRoi) || 0.0);
    const fRoiY2 = financialRoiY2 !== undefined ? safeFloat(financialRoiY2) : (safeFloat(financialRoi) || 0.0);
    const fRoiY3 = financialRoiY3 !== undefined ? safeFloat(financialRoiY3) : (safeFloat(financialRoi) || 0.0);

    const bReqY1 = budgetRequiredY1 !== undefined ? safeFloat(budgetRequiredY1) : (safeFloat(budgetRequiredVal) || 0.0);
    const bReqY2 = budgetRequiredY2 !== undefined ? safeFloat(budgetRequiredY2) : 0.0;
    const bReqY3 = budgetRequiredY3 !== undefined ? safeFloat(budgetRequiredY3) : 0.0;

    const calculatedRoi = fRoiY1;
    const calculatedBudget = bReqY1 + bReqY2 + bReqY3;

    // Build embedding text representation
    const embedTextStr = `${finalTitle} ${finalProblem} ${safeStringArray(integrations).join(' ')} ${finalDomains.join(' ')} ${safeStringArray(therapeuticAreas).join(' ')}`;

    if (id) {
      // Update existing project
      const updatedProject = await prisma.project.update({
        where: { id },
        data: {
          title: finalTitle,
          problemStatement: finalProblem,
          integrations: safeStringArray(integrations),
          budgetStatus: safeString(budgetStatus, 'Under Review'),
          stakeholderStatus: safeString(stakeholderStatus, 'TBD'),
          opportunityCost: safeString(opportunityCost, ''),
          businessCase: safeString(businessCase, ''),
          financialRoi: calculatedRoi,
          budgetRequiredVal: calculatedBudget,
          execSponsor: safeString(execSponsor, 'TBD'),
          productOwner: safeString(productOwner, 'TBD'),
          deploymentGateway: safeString(deploymentGateway, ''),
          phase: safeString(phase, 'Backlog'),
          therapeuticAreas: safeStringArray(therapeuticAreas),
          budgetAvailabilityScore: safeFloat(budgetAvailabilityScore),
          dataAvailabilityScore: safeFloat(dataAvailabilityScore),
          stakeholderReadinessScore: safeFloat(stakeholderReadinessScore),
          impactOfNotDoingScore: safeFloat(impactOfNotDoingScore),
          financialBusinessCaseScore: safeFloat(financialBusinessCaseScore),
          budgetRequiredScore: safeFloat(budgetRequiredScore),
          readinessScore: safeFloat(readinessScore),
          functionalDomains: finalDomains,
          ideaScore: safeFloat(ideaScore, 70.0),
          checkerInsight: safeString(checkerInsight),
          brainstormerInsight: safeString(brainstormerInsight),
          validatorInsight: safeString(validatorInsight),
          businessCaseInsight: safeString(businessCaseInsight),
          criticInsight: safeString(criticInsight),
          financialRoiY1: fRoiY1,
          financialRoiY2: fRoiY2,
          financialRoiY3: fRoiY3,
          budgetRequiredY1: bReqY1,
          budgetRequiredY2: bReqY2,
          budgetRequiredY3: bReqY3,
          businessCaseRationale: safeString(businessCaseRationale),
          dependencies: safeString(dependencies),
          businessCaseFile: safeString(businessCaseFile),
          submittedBy: safeString(submittedBy),
          submittedAt: finalSubmittedAt,
          feedback: safeString(feedback)
        }
      });

      const embedding = await embedText(embedTextStr);
      const embeddingStr = `[${embedding.join(',')}]`;

      await prisma.$executeRawUnsafe(`
        INSERT INTO "ProjectEmbedding" ("id", "projectId", "embedding", "createdAt")
        VALUES (gen_random_uuid(), $1, $2::vector, NOW())
        ON CONFLICT ("projectId")
        DO UPDATE SET "embedding" = $2::vector;
      `, updatedProject.id, embeddingStr);

      return NextResponse.json(updatedProject);
    } else {
      // Create new project
      const newProject = await prisma.project.create({
        data: {
          title: finalTitle,
          problemStatement: finalProblem,
          integrations: safeStringArray(integrations),
          budgetStatus: safeString(budgetStatus, 'Under Review'),
          stakeholderStatus: safeString(stakeholderStatus, 'TBD'),
          opportunityCost: safeString(opportunityCost, ''),
          businessCase: safeString(businessCase, ''),
          financialRoi: calculatedRoi,
          budgetRequiredVal: calculatedBudget,
          execSponsor: safeString(execSponsor, 'TBD'),
          productOwner: safeString(productOwner, 'TBD'),
          deploymentGateway: safeString(deploymentGateway, ''),
          phase: safeString(phase, 'Backlog'),
          therapeuticAreas: safeStringArray(therapeuticAreas),
          budgetAvailabilityScore: safeFloat(budgetAvailabilityScore),
          dataAvailabilityScore: safeFloat(dataAvailabilityScore),
          stakeholderReadinessScore: safeFloat(stakeholderReadinessScore),
          impactOfNotDoingScore: safeFloat(impactOfNotDoingScore),
          financialBusinessCaseScore: safeFloat(financialBusinessCaseScore),
          budgetRequiredScore: safeFloat(budgetRequiredScore),
          readinessScore: safeFloat(readinessScore),
          functionalDomains: finalDomains,
          ideaScore: safeFloat(ideaScore, 70.0),
          checkerInsight: safeString(checkerInsight),
          brainstormerInsight: safeString(brainstormerInsight),
          validatorInsight: safeString(validatorInsight),
          businessCaseInsight: safeString(businessCaseInsight),
          criticInsight: safeString(criticInsight),
          financialRoiY1: fRoiY1,
          financialRoiY2: fRoiY2,
          financialRoiY3: fRoiY3,
          budgetRequiredY1: bReqY1,
          budgetRequiredY2: bReqY2,
          budgetRequiredY3: bReqY3,
          businessCaseRationale: safeString(businessCaseRationale),
          dependencies: safeString(dependencies),
          businessCaseFile: safeString(businessCaseFile),
          submittedBy: safeString(submittedBy),
          submittedAt: finalSubmittedAt,
          feedback: safeString(feedback)
        }
      });

      const embedding = await embedText(embedTextStr);
      const embeddingStr = `[${embedding.join(',')}]`;

      await prisma.$executeRawUnsafe(`
        INSERT INTO "ProjectEmbedding" ("id", "projectId", "embedding", "createdAt")
        VALUES (gen_random_uuid(), $1, $2::vector, NOW())
      `, newProject.id, embeddingStr);

      return NextResponse.json(newProject);
    }
  } catch (error: any) {
    console.error('API POST projects failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { id }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.phase !== 'Draft') {
      return NextResponse.json({ error: 'Only drafts can be deleted' }, { status: 403 });
    }

    // Cascade delete is defined in schema, but to be safe, delete embedding first
    await prisma.$executeRawUnsafe('DELETE FROM "ProjectEmbedding" WHERE "projectId" = $1', id);
    await prisma.project.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API DELETE project failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
