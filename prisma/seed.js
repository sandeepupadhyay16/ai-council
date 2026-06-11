const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/ai_council_platform?schema=public&connection_limit=15";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const projects = [
  {
    title: "Omnichannel Brand Campaign Optimization",
    problemStatement: "Brand campaigns on oncology therapeutics are suffering from low digital click-through-rates and fragmented engagement data across channels.",
    integrations: ["Salesforce CRM", "Adobe Target"],
    budgetStatus: "Pre-allocated in standard commercial budget",
    stakeholderStatus: "Angela Vance and Oncology marketing lead aligned",
    opportunityCost: "Low CTRs persist, leading to low conversions and inefficient digital ad spending",
    businessCase: "Increase digital channel CTR by 25% and reduce agency content generation costs by 40%.",
    financialRoi: 320000.0,
    budgetRequiredVal: 120000.0,
    execSponsor: "Dr. Angela Vance, VP Oncology Marketing",
    productOwner: "Marcus Broady, Senior Brand Manager",
    deploymentGateway: "http://oncology-omnichannel.pfizer.internal",
    phase: "Ready",
    budgetAvailabilityScore: 100.0,
    dataAvailabilityScore: 90.0,
    stakeholderReadinessScore: 95.0,
    impactOfNotDoingScore: 80.0,
    financialBusinessCaseScore: 90.0,
    budgetRequiredScore: 85.0,
    readinessScore: 90.0,
    functionalDomain: "Omnichannel Intelligence",
    therapeuticAreas: ["Oncology", "Vaccines"]
  },
  {
    title: "Vaccine Demand Predictive Modeling",
    problemStatement: "Predictive modeling of regional vaccine demand spikes is inaccurate, leading to inventory shortages or supply chain overages.",
    integrations: ["Veeva", "Custom Supply APIs"],
    budgetStatus: "Under review for FY26 funding allocation",
    stakeholderStatus: "Vaccine Commercial Head aligned; supply chain sponsors locked",
    opportunityCost: "Stockouts at key clinical sites leading to lost vaccine sales and local distributor friction",
    businessCase: "Reduces vaccine delivery lead times by 18% and supply waste by 12%.",
    financialRoi: 540000.0,
    budgetRequiredVal: 180050.0,
    execSponsor: "Thomas Wright, Head of Vaccines Commercial",
    productOwner: "Sarah Jenkins, Product Director",
    deploymentGateway: "http://vaccine-predictive.pfizer.internal",
    phase: "Working",
    budgetAvailabilityScore: 85.0,
    dataAvailabilityScore: 75.0,
    stakeholderReadinessScore: 85.0,
    impactOfNotDoingScore: 90.0,
    financialBusinessCaseScore: 88.0,
    budgetRequiredScore: 78.0,
    readinessScore: 81.8,
    functionalDomain: "Campaign Measurement Intelligence",
    therapeuticAreas: ["Vaccines", "Internal Medicine"]
  },
  {
    title: "Rare Disease Patient Identification Engine",
    problemStatement: "Slow patient diagnosis paths for ultra-rare cardiovascular diseases delay treatment access.",
    integrations: ["Patient Registries", "Epic EHR"],
    budgetStatus: "Fully approved under Rare Disease priority initiative",
    stakeholderStatus: "Linda Hsieh aligned, clinical panel fully committed",
    opportunityCost: "Patients remain undiagnosed for years, leading to progressive organ damage and lost treatment windows",
    businessCase: "Reduces time-to-diagnosis from 4 years to 1.2 years for potential patients.",
    financialRoi: 1200000.0,
    budgetRequiredVal: 350000.0,
    execSponsor: "Linda Hsieh, VP Rare Diseases",
    productOwner: "Ryan Patel, Commercial Lead",
    deploymentGateway: "http://rare-patient-id.pfizer.internal",
    phase: "Scheduled",
    budgetAvailabilityScore: 100.0,
    dataAvailabilityScore: 95.0,
    stakeholderReadinessScore: 100.0,
    impactOfNotDoingScore: 95.0,
    financialBusinessCaseScore: 92.0,
    budgetRequiredScore: 88.0,
    readinessScore: 95.0,
    functionalDomain: "Patient Identification",
    therapeuticAreas: ["Rare Diseases"]
  },
  {
    title: "Omnichannel Field Representative Recommender",
    problemStatement: "Sales reps lack real-time digital trigger alerts, causing missed contact opportunities during critical brand cycles.",
    integrations: ["Salesforce CRM", "Veeva"],
    budgetStatus: "Requested; pending steering committee vote",
    stakeholderStatus: "Thomas Wright approved, local field leads are skeptical",
    opportunityCost: "Lost sales opportunities due to delayed or irrelevant rep follow-ups with key practitioners",
    businessCase: "Boosts rep-to-physician contact rates by 30% and content relevance scores by 45%.",
    financialRoi: 450000.0,
    budgetRequiredVal: 150000.0,
    execSponsor: "Thomas Wright, Head of Vaccines Commercial",
    productOwner: "Jessica Martinez, Field Force Coordinator",
    deploymentGateway: "http://field-force-recommender.pfizer.internal",
    phase: "Backlog",
    budgetAvailabilityScore: 50.0,
    dataAvailabilityScore: 40.0,
    stakeholderReadinessScore: 60.0,
    impactOfNotDoingScore: 70.0,
    financialBusinessCaseScore: 75.0,
    budgetRequiredScore: 60.0,
    readinessScore: 59.2,
    functionalDomain: "Field Force Automation",
    therapeuticAreas: ["Vaccines", "Oncology"]
  },
  {
    title: "Inflammation & Immunology Patient Journey Mapping",
    problemStatement: "Brand teams are unable to identify early-stage rheumatoid arthritis patients before severe joint damage occurs, leading to delayed treatment lines.",
    integrations: ["Epic EHR", "Adobe Target"],
    budgetStatus: "Pre-allocated; pending Q3 release",
    stakeholderStatus: "Brand leaders committed; alignment is strong",
    opportunityCost: "Delayed intervention for patients leading to poor long-term outcomes and loss of early-treatment brand loyalty",
    businessCase: "Accelerate identification of potential patients by 6 months, improving early intervention rates by 22%.",
    financialRoi: 680000.0,
    budgetRequiredVal: 200000.0,
    execSponsor: "Dr. Angela Vance, VP Oncology Marketing",
    productOwner: "Sarah Jenkins, Product Director",
    deploymentGateway: "http://immuno-journey.pfizer.internal",
    phase: "Working",
    budgetAvailabilityScore: 85.0,
    dataAvailabilityScore: 80.0,
    stakeholderReadinessScore: 90.0,
    impactOfNotDoingScore: 85.0,
    financialBusinessCaseScore: 85.0,
    budgetRequiredScore: 80.0,
    readinessScore: 84.2,
    functionalDomain: "Patient Identification",
    therapeuticAreas: ["Inflammation & Immunology", "Internal Medicine"]
  },
  {
    title: "Omnichannel Digital Content Personalization Engine",
    problemStatement: "Generic email marketing content sent to general practitioners results in low open rates (under 12%) and unsubscribes.",
    integrations: ["Salesforce CRM", "Adobe Target", "Veeva"],
    budgetStatus: "Fully funded under omnichannel budget",
    stakeholderStatus: "Sponsors aligned; regional managers onboarding",
    opportunityCost: "Unsubscribe rates rise, wasting marketing assets and reducing rep email effectiveness",
    businessCase: "Increases email open rates by 35% and improves click-through conversion by 50% across key brands.",
    financialRoi: 410000.0,
    budgetRequiredVal: 130000.0,
    execSponsor: "Linda Hsieh, VP Rare Diseases",
    productOwner: "Marcus Broady, Senior Brand Manager",
    deploymentGateway: "http://im-personalization.pfizer.internal",
    phase: "Ready",
    budgetAvailabilityScore: 95.0,
    dataAvailabilityScore: 90.0,
    stakeholderReadinessScore: 90.0,
    impactOfNotDoingScore: 85.0,
    financialBusinessCaseScore: 88.0,
    budgetRequiredScore: 82.0,
    readinessScore: 88.3,
    functionalDomain: "Omnichannel Intelligence",
    therapeuticAreas: ["Internal Medicine", "Vaccines"]
  },
  {
    title: "Vaccine Co-administration Propensity Estimator",
    problemStatement: "Lack of insight into co-prescription rates for respiratory vaccines leads to sub-optimal marketing bundles.",
    integrations: ["National Claims Database"],
    budgetStatus: "Proposed for FY26 planning",
    stakeholderStatus: "Thomas Wright approved, pending brand operations sign-off",
    opportunityCost: "Missed clinical co-administration bundles leading to separate dosing visits and patient drop-offs",
    businessCase: "Improves bundle promotional conversion rates by 18% and optimization of co-administration marketing.",
    financialRoi: 310000.0,
    budgetRequiredVal: 90000.0,
    execSponsor: "Thomas Wright, Head of Vaccines Commercial",
    productOwner: "Marcus Broady, Senior Brand Manager",
    deploymentGateway: "http://vaccines-coadmin.pfizer.internal",
    phase: "Backlog",
    budgetAvailabilityScore: 70.0,
    dataAvailabilityScore: 85.0,
    stakeholderReadinessScore: 75.0,
    impactOfNotDoingScore: 65.0,
    financialBusinessCaseScore: 80.0,
    budgetRequiredScore: 85.0,
    readinessScore: 76.6,
    functionalDomain: "Campaign Measurement Intelligence",
    therapeuticAreas: ["Vaccines"]
  },
  {
    title: "Rare Disease Genetic Screening Diagnostic Trigger",
    problemStatement: "Undiagnosed rare pediatric metabolic disorders lead to progressive organ damage before correct referral occurs.",
    integrations: ["Genomic Registry", "Custom Alerts Module"],
    budgetStatus: "Approved by Steering Committee",
    stakeholderStatus: "Rare disease director and medical boards aligned",
    opportunityCost: "Irreversible developmental delays in children due to late screening triage and missed diagnostics",
    businessCase: "Decreases typical time-to-diagnosis from 3 years to 4 months, accelerating access to specialized therapy.",
    financialRoi: 1500000.0,
    budgetRequiredVal: 400000.0,
    execSponsor: "Linda Hsieh, VP Rare Diseases",
    productOwner: "Ryan Patel, Commercial Lead",
    deploymentGateway: "http://rare-screening-id.pfizer.internal",
    phase: "Scheduled",
    budgetAvailabilityScore: 100.0,
    dataAvailabilityScore: 90.0,
    stakeholderReadinessScore: 95.0,
    impactOfNotDoingScore: 100.0,
    financialBusinessCaseScore: 95.0,
    budgetRequiredScore: 80.0,
    readinessScore: 93.3,
    functionalDomain: "Patient Identification",
    therapeuticAreas: ["Rare Diseases", "Inflammation & Immunology"]
  },
  {
    title: "Omnichannel Field Force Next-Best-Action Engine",
    problemStatement: "Primary care reps lack clear guidance on whether to contact physicians via face-to-face visits, emails, or phone calls.",
    integrations: ["Veeva", "Adobe Target", "Salesforce CRM"],
    budgetStatus: "Pre-allocated; part of global digital transformation",
    stakeholderStatus: "All brand directors and field force managers aligned",
    opportunityCost: "Sales reps contact practitioners via suboptimal channels, leading to doctor fatigue and low engagement rates",
    businessCase: "Boosts sales rep productivity by 20% and brand recall by 28% in target territories.",
    financialRoi: 490000.0,
    budgetRequiredVal: 160000.0,
    execSponsor: "Thomas Wright, Head of Vaccines Commercial",
    productOwner: "Marcus Broady, Senior Brand Manager",
    deploymentGateway: "http://im-next-best-action.pfizer.internal",
    phase: "Ready",
    budgetAvailabilityScore: 90.0,
    dataAvailabilityScore: 85.0,
    stakeholderReadinessScore: 95.0,
    impactOfNotDoingScore: 85.0,
    financialBusinessCaseScore: 88.0,
    budgetRequiredScore: 82.0,
    readinessScore: 87.5,
    functionalDomain: "Field Force Automation",
    therapeuticAreas: ["Internal Medicine", "Oncology"]
  }
];

const experts = [
  {
    name: "Dr. Evelyn Vance",
    title: "Director of Natural Language Processing",
    organization: "Global Data Science & AI",
    availability: "Available",
    email: "evelyn.vance@pfizer.com",
    teamsId: "evelyn.vance.teams",
    competencies: ["NLP", "Machine Learning", "Generative AI", "Text Analytics"]
  },
  {
    name: "Dr. Alex Mercer",
    title: "Principal Data Scientist, Omnichannel Analytics",
    organization: "Global Commercial Operations",
    availability: "Busy",
    email: "alex.mercer@pfizer.com",
    teamsId: "alex.mercer.teams",
    competencies: ["Omnichannel Analytics", "Predictive Modeling", "CRM Integration"]
  },
  {
    name: "Elena Rostova",
    title: "Lead Machine Learning Engineer",
    organization: "Global Data Science & AI",
    availability: "Limited",
    email: "elena.rostova@pfizer.com",
    teamsId: "elena.rostova.teams",
    competencies: ["Machine Learning", "Reinforcement Learning", "Model Deployment"]
  },
  {
    name: "David Chen",
    title: "Commercial Regulatory Lead (IT Compliance)",
    organization: "Commercial Compliance & Governance",
    availability: "Available",
    email: "david.chen@pfizer.com",
    teamsId: "david.chen.teams",
    competencies: ["Commercial Regulatory Compliance", "Data Governance"]
  }
];

async function getEmbedding(text) {
  const url = process.env.LM_STUDIO_BASE_URL ? `${process.env.LM_STUDIO_BASE_URL}/embeddings` : 'http://127.0.0.1:1234/v1/embeddings';
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.LOCAL_EMBEDDING_MODEL || 'text-embedding-nomic-embed-text-v1.5',
        input: text
      })
    });
    if (!response.ok) {
      throw new Error(`Embedding request failed: ${response.statusText}`);
    }
    const data = await response.json();
    return data.data[0].embedding;
  } catch (err) {
    console.error(`Error fetching embedding for: "${text.substring(0, 30)}..."`, err);
    return new Array(768).fill(0).map(() => Math.random() - 0.5);
  }
}

async function main() {
  console.log("Seeding started...");

  // Clean tables
  await prisma.$executeRaw`TRUNCATE "Project", "ProjectEmbedding", "Expert", "ExpertEmbedding", "MeetingIngestion" CASCADE;`;
  console.log("Cleared existing database records.");

  // Insert Projects and generate embeddings
  for (const projData of projects) {
    const { functionalDomain, ...rest } = projData;
    const proj = await prisma.project.create({
      data: {
        ...rest,
        functionalDomains: [functionalDomain],
        ideaScore: projData.readinessScore || 75.0,
        checkerInsight: "Portfolio audit verified: unique concept.",
        brainstormerInsight: "Recommended feature: Custom workflow triggers and omnichannel analytics dashboards.",
        validatorInsight: "Technical integration with Veeva/Adobe Target is verified. Low feasibility risk.",
        businessCaseInsight: "Annualized savings show strong positive ROI exceeding standard 13% hurdle rate.",
        criticInsight: "Operational challenge: Ensure field force training matches automated recommendation triggers."
      }
    });
    console.log(`Created Project: ${proj.title}`);

    // Generate embedding text
    const embedText = `${proj.title} ${proj.problemStatement} ${proj.integrations.join(' ')} ${proj.functionalDomains.join(' ')} ${proj.therapeuticAreas.join(' ')}`;
    const embedding = await getEmbedding(embedText);
    const embeddingStr = `[${embedding.join(',')}]`;

    await prisma.$executeRaw`
      INSERT INTO "ProjectEmbedding" ("id", "projectId", "embedding", "createdAt")
      VALUES (gen_random_uuid(), ${proj.id}, ${embeddingStr}::vector, NOW())
    `;
    console.log(`Generated and saved embedding for project: ${proj.title}`);
  }

  // Insert Experts and generate embeddings
  for (const expData of experts) {
    const exp = await prisma.expert.create({
      data: expData
    });
    console.log(`Created Expert: ${exp.name}`);

    // Generate embedding text
    const embedText = `${exp.name} ${exp.title} ${exp.organization} ${exp.competencies.join(' ')}`;
    const embedding = await getEmbedding(exp.name + " " + exp.title + " " + exp.organization);
    const embeddingStr = `[${embedding.join(',')}]`;

    await prisma.$executeRaw`
      INSERT INTO "ExpertEmbedding" ("id", "expertId", "embedding", "createdAt")
      VALUES (gen_random_uuid(), ${exp.id}, ${embeddingStr}::vector, NOW())
    `;
    console.log(`Generated and saved embedding for expert: ${exp.name}`);
  }

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
