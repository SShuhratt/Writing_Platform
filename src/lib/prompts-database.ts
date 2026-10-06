import { IELTSTaskPrompt } from '@/types/ielts';

export const OFFICIAL_PROMPTS_DATABASE: IELTSTaskPrompt[] = [
  // ============================================================================
  // TASK 2 ESSAYS (MULTIPLE TYPES: OPINION, DISCUSSION, ADV/DISADV, PROBLEM/SOLUTION, TWO-PART)
  // ============================================================================
  {
    id: 'task2-tech-education',
    title: 'Technology in Education',
    type: 'TASK_2_ESSAY',
    category: 'Education & Technology (Agree / Disagree)',
    questionText: 'Some people believe that online learning will completely replace traditional classroom education in universities in the near future. To what extent do you agree or disagree with this statement?',
    minWordCount: 250,
    recommendedTimeMinutes: 40
  },
  {
    id: 'task2-environment-carbon',
    title: 'Environmental Responsibility',
    type: 'TASK_2_ESSAY',
    category: 'Environment & Policy (Discuss Both Views)',
    questionText: 'Some people argue that individuals should take personal responsibility for reducing global pollution, while others believe that major corporations and national governments should bear full responsibility. Discuss both views and give your opinion.',
    minWordCount: 250,
    recommendedTimeMinutes: 40
  },
  {
    id: 'task2-globalization-culture',
    title: 'Globalization & Local Traditions',
    type: 'TASK_2_ESSAY',
    category: 'Culture & Society (Advantages vs Disadvantages)',
    questionText: 'Globalization has allowed foreign products and cultural trends to dominate domestic markets. Do the advantages of this trend outweigh the disadvantages?',
    minWordCount: 250,
    recommendedTimeMinutes: 40
  },
  {
    id: 'task2-urban-traffic-pollution',
    title: 'Urban Traffic & Public Transit',
    type: 'TASK_2_ESSAY',
    category: 'Urbanization & Transport (Problem & Solution)',
    questionText: 'In many cities around the world, traffic congestion and air pollution are worsening due to rapid urbanization and the growing number of private vehicles. What are the primary causes of this problem, and what measures can be taken by governments to resolve it?',
    minWordCount: 250,
    recommendedTimeMinutes: 40
  },
  {
    id: 'task2-remote-work-productivity',
    title: 'Remote Work vs Office Attendance',
    type: 'TASK_2_ESSAY',
    category: 'Workplace & Economy (Discuss Both Views)',
    questionText: 'Some employers think that allowing staff to work remotely from home leads to higher productivity, while others maintain that physical office attendance is essential for effective collaboration. Discuss both views and give your opinion.',
    minWordCount: 250,
    recommendedTimeMinutes: 40
  },
  {
    id: 'task2-fast-food-health',
    title: 'Fast Food & Public Health',
    type: 'TASK_2_ESSAY',
    category: 'Health & Lifestyle (Two-Part Question)',
    questionText: 'In many developed and developing countries, the consumption of fast food is increasing rapidly, leading to serious public health issues. Why is fast food becoming so popular, and what can be done to encourage healthier dietary habits?',
    minWordCount: 250,
    recommendedTimeMinutes: 40
  },
  {
    id: 'task2-space-exploration',
    title: 'Space Exploration vs Earth Funding',
    type: 'TASK_2_ESSAY',
    category: 'Science & Society (To What Extent)',
    questionText: 'Governments around the world spend billions of dollars on space exploration programs. Some people argue that this money would be far better spent solving immediate social and environmental problems on Earth. To what extent do you agree or disagree?',
    minWordCount: 250,
    recommendedTimeMinutes: 40
  },
  {
    id: 'task2-youth-crime-prevention',
    title: 'Youth Crime & Community Support',
    type: 'TASK_2_ESSAY',
    category: 'Crime & Society (Causes & Solutions)',
    questionText: 'In several nations, crime rates among young people have risen noticeably over the past decade. What are the key reasons behind this increase, and what effective strategies can communities and educational institutions adopt to prevent youth criminality?',
    minWordCount: 250,
    recommendedTimeMinutes: 40
  },
  {
    id: 'task2-ai-workplace-automation',
    title: 'Artificial Intelligence & Employment',
    type: 'TASK_2_ESSAY',
    category: 'Technology & Economy (Discuss Both Views)',
    questionText: 'Some experts warn that rapid advancements in artificial intelligence and automation will displace millions of workers and trigger widespread economic instability. Others believe AI will create unprecedented industries and liberate humans from repetitive labor. Discuss both views and give your own perspective.',
    minWordCount: 250,
    recommendedTimeMinutes: 40
  },
  {
    id: 'task2-heritage-modern-skyscrapers',
    title: 'Historic Preservation vs Urban Renewal',
    type: 'TASK_2_ESSAY',
    category: 'Architecture & Heritage (Advantages vs Disadvantages)',
    questionText: 'In numerous modern metropolitan cities, historical buildings are frequently demolished to clear land for high-rise commercial complexes and modern residential towers. Do the advantages of this urban modernization outweigh the disadvantages?',
    minWordCount: 250,
    recommendedTimeMinutes: 40
  },
  {
    id: 'task2-university-curriculum-practical',
    title: 'University Education: Career Skills vs Broad Theory',
    type: 'TASK_2_ESSAY',
    category: 'Higher Education (Discuss Both Views)',
    questionText: 'Some educators contend that university degree courses should focus strictly on practical knowledge and professional qualifications that directly prepare students for the job market. Others argue that universities must deliver a comprehensive theoretical education that nurtures independent critical thinking. Discuss both sides and state your opinion.',
    minWordCount: 250,
    recommendedTimeMinutes: 40
  },
  {
    id: 'task2-single-use-plastic-ban',
    title: 'Single-Use Plastics & Ocean Conservation',
    type: 'TASK_2_ESSAY',
    category: 'Environmental Protection (Opinion Essay)',
    questionText: 'Plastic pollution in oceans and waterways has reached catastrophic levels. Some environmentalists believe the only effective solution is a total national and international ban on all single-use plastic packaging and consumer products. To what extent do you agree or disagree?',
    minWordCount: 250,
    recommendedTimeMinutes: 40
  },

  // ============================================================================
  // TASK 1 ACADEMIC (GRAPHS, BAR CHARTS, PIE CHARTS, MAPS, PROCESS DIAGRAMS, TABLES)
  // ============================================================================
  {
    id: 'task1-acad-water-consumption',
    title: 'Global Water Usage (1900–2000)',
    type: 'TASK_1_ACADEMIC',
    category: 'Line Graph & Data Trends',
    illustrationType: 'LINE_GRAPH',
    chartDescription: 'The line graph below illustrates global water consumption in three distinct sectors (Agriculture, Industrial, and Domestic) from 1900 to 2000 in cubic kilometers per year.',
    questionText: 'Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    minWordCount: 150,
    recommendedTimeMinutes: 20
  },
  {
    id: 'task1-acad-electricity-production',
    title: 'Electricity Production by Source',
    type: 'TASK_1_ACADEMIC',
    category: 'Bar Chart & Country Comparison',
    illustrationType: 'BAR_CHART',
    chartDescription: 'The bar chart compares the percentage of electricity generated from fossil fuels, nuclear power, and renewable resources across four European nations (Germany, France, UK, and Sweden) in 2020.',
    questionText: 'Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    minWordCount: 150,
    recommendedTimeMinutes: 20
  },
  {
    id: 'task1-acad-household-expenditure',
    title: 'Household Spending Patterns (1980 vs 2020)',
    type: 'TASK_1_ACADEMIC',
    category: 'Pie Charts & Budget Proportions',
    illustrationType: 'PIE_CHARTS',
    chartDescription: 'The two pie charts compare the proportion of average family income spent on five essential budget categories (Food, Housing, Transport, Energy, and Recreation) in 1980 and 2020.',
    questionText: 'Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    minWordCount: 150,
    recommendedTimeMinutes: 20
  },
  {
    id: 'task1-acad-brick-manufacturing',
    title: 'Industrial Brick Manufacturing Process',
    type: 'TASK_1_ACADEMIC',
    category: 'Process Diagram & Linear Flowchart',
    illustrationType: 'PROCESS_DIAGRAM',
    chartDescription: 'The flowchart below illustrates the sequential industrial stages involved in manufacturing construction bricks from raw clay excavation to market delivery.',
    questionText: 'Summarise the information by selecting and reporting the main features, and describe the stages of the process where relevant.',
    minWordCount: 150,
    recommendedTimeMinutes: 20
  },
  {
    id: 'task1-acad-hydroelectric-dam',
    title: 'Hydroelectric Power Station Generation Cycle',
    type: 'TASK_1_ACADEMIC',
    category: 'Process Diagram & Engineering Flow',
    illustrationType: 'PROCESS_DIAGRAM',
    chartDescription: 'The diagram shows the operational mechanism and sequential cycle by which a hydroelectric dam harnesses water pressure to generate and transmit electrical power to the national grid.',
    questionText: 'Summarise the information by selecting and reporting the main features, and describe the stages of the energy generation cycle where relevant.',
    minWordCount: 150,
    recommendedTimeMinutes: 20
  },
  {
    id: 'task1-acad-norbiton-town-map',
    title: 'Town of Norbiton Redevelopment Plan',
    type: 'TASK_1_ACADEMIC',
    category: 'Map Comparison (Existing vs Proposed Plan)',
    illustrationType: 'MAP_COMPARISON',
    chartDescription: 'The two maps show the industrial town of Norbiton as it is currently situated, and the planned municipal redevelopment proposal for the future.',
    questionText: 'Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    minWordCount: 150,
    recommendedTimeMinutes: 20
  },
  {
    id: 'task1-acad-felixstone-coastal-resort',
    title: 'Coastal Village of Felixstone (1995 vs 2025)',
    type: 'TASK_1_ACADEMIC',
    category: 'Map Comparison (Historical vs Modern Resort)',
    illustrationType: 'MAP_COMPARISON',
    chartDescription: 'The two maps illustrate the transformation of the coastal village of Felixstone from a traditional fishing settlement in 1995 into a modern recreational tourist resort in 2025.',
    questionText: 'Summarise the information by selecting and reporting the main features, and make comparisons between the two time periods.',
    minWordCount: 150,
    recommendedTimeMinutes: 20
  },
  {
    id: 'task1-acad-tourist-destinations-table',
    title: 'International Tourist Arrivals & Revenue',
    type: 'TASK_1_ACADEMIC',
    category: 'Statistical Matrix & Data Table',
    illustrationType: 'TABLE',
    chartDescription: 'The table shows the number of international visitor arrivals (millions) and tourism revenue (billion USD) in five leading countries in 2015 and 2023.',
    questionText: 'Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    minWordCount: 150,
    recommendedTimeMinutes: 20
  },

  // ============================================================================
  // TASK 1 GENERAL TRAINING (LETTERS)
  // ============================================================================
  {
    id: 'task1-gen-accommodation-complaint',
    title: 'Letter to Rental Agency',
    type: 'TASK_1_GENERAL',
    category: 'Formal Complaint Letter',
    questionText: 'You recently rented an apartment through a housing agency, but you have experienced several maintenance issues that have not been fixed despite your initial requests.\n\nWrite a letter to the manager of the rental agency. In your letter:\n- Explain the details of your apartment and lease\n- Describe the specific maintenance problems\n- State what action you expect the manager to take immediately.',
    minWordCount: 150,
    recommendedTimeMinutes: 20
  },
  {
    id: 'task1-gen-job-application',
    title: 'Job Application Cover Letter',
    type: 'TASK_1_GENERAL',
    category: 'Professional Application Letter',
    questionText: 'You have seen an advertisement for a part-time position as a tour guide at an international heritage center in your city.\n\nWrite a letter to the recruitment director. In your letter:\n- State why you are applying for the position\n- Outline your relevant linguistic skills and customer service experience\n- Explain when you would be available for an interview and what hours you can work.',
    minWordCount: 150,
    recommendedTimeMinutes: 20
  }
];
