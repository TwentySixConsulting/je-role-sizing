/**
 * Words worth looking for in a job description when scoring each factor.
 *
 * These are a reading aid only - they speed up finding the relevant paragraph
 * and are never used to suggest or calculate a level. Deliberately broad, so
 * they surface candidates rather than pretending to be evidence.
 */
export const FACTOR_CUES: Record<string, string[]> = {
  'professional-expertise': [
    'degree', 'qualification', 'qualified', 'qualifications', 'chartered', 'CIPD', 'CIMA',
    'ACCA', 'ACA', 'RICS', 'CIOB', 'CIH', 'NVQ', 'HNC', 'HND', 'apprenticeship',
    'professional', 'technical', 'specialist', 'expert', 'accredited', 'licence',
    'trade', 'vocational', 'numeracy', 'literacy', 'GCSE', 'A level', 'training',
  ],
  'commercial-and-operational-know-how': [
    'commercial', 'financial', 'budget', 'budgets', 'income', 'cost', 'value for money',
    'regulatory', 'regulator', 'regulation', 'statutory', 'market', 'sector',
    'political', 'business plan', 'operating environment', 'external environment',
    'procurement', 'contract', 'contracts', 'tender', 'operating model',
  ],
  'working-with-and-through-people-to-deliver': [
    'line manage', 'line management', 'manage', 'manages', 'supervise', 'supervision',
    'coach', 'coaching', 'mentor', 'mentoring', 'team', 'teams', 'motivate',
    'direct reports', 'lead', 'leads', 'leading', 'leadership', 'develop staff',
    'appraisal', 'one to one', 'inspire', 'matrix',
  ],
  communicating: [
    'communicate', 'communication', 'present', 'presentation', 'report', 'reports',
    'write', 'written', 'verbal', 'negotiate', 'influence', 'explain', 'liaise',
    'correspondence', 'brief', 'briefing', 'audience', 'committee', 'board',
    'listen', 'advise', 'advice', 'difficult conversations',
  ],
  'building-relationships': [
    'relationship', 'relationships', 'stakeholder', 'stakeholders', 'partner',
    'partners', 'partnership', 'network', 'networks', 'collaborate', 'collaboration',
    'external agencies', 'customer', 'customers', 'resident', 'residents', 'tenant',
    'conflict', 'rapport', 'trust', 'supplier', 'contractor',
  ],
  'analysis-and-insight': [
    'analyse', 'analyses', 'analysis', 'analytical', 'data', 'evaluate', 'evaluation',
    'interpret', 'research', 'monitor', 'monitoring', 'review', 'evidence', 'insight',
    'trends', 'investigate', 'diagnose', 'assess', 'assessment', 'audit', 'metrics',
    'performance information',
  ],
  'developing-solutions': [
    'solution', 'solutions', 'resolve', 'resolution', 'problem', 'problems',
    'problem solving', 'recommend', 'recommendation', 'options', 'design', 'develop',
    'improve', 'troubleshoot', 'remedy', 'proposals', 'business case',
  ],
  'change-and-innovation': [
    'change', 'innovate', 'innovation', 'innovative', 'improvement', 'continuous improvement',
    'transform', 'transformation', 'new ways of working', 'redesign', 'project',
    'projects', 'initiative', 'initiatives', 'modernise', 'creative', 'best practice',
    'digital',
  ],
  'responsibility-and-ownership': [
    'responsible', 'responsibility', 'accountable', 'accountability', 'own',
    'ownership', 'deliver', 'delivery', 'plan', 'planning', 'budget', 'budgets',
    'resources', 'end to end', 'end-to-end', 'caseload', 'service', 'oversee',
    'ensure', 'maintain', 'business plan', 'strategy', 'strategic plan',
  ],
  'decision-making': [
    'decide', 'decision', 'decisions', 'judgement', 'judgment', 'authority',
    'discretion', 'approve', 'approval', 'sign off', 'sign-off', 'authorise',
    'policy', 'policies', 'guidelines', 'escalate', 'delegated', 'mandate',
  ],
  'context-and-impact': [
    'complex', 'complexity', 'risk', 'risks', 'impact', 'ambiguity', 'ambiguous',
    'sensitive', 'confidential', 'safeguarding', 'statutory', 'compliance',
    'organisation-wide', 'reputation', 'reputational', 'health and safety',
    'vulnerable', 'high profile', 'challenging', 'conflicting',
  ],
}
