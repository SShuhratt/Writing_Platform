import { IELTSTaskPrompt } from '@/types/ielts';

export const OFFICIAL_PROMPTS_DATABASE: IELTSTaskPrompt[] = [
  {
    id: 'task2-tech-education',
    title: 'Technology in Education',
    type: 'TASK_2_ESSAY',
    category: 'Education & Technology',
    questionText: 'Some people believe that online learning will completely replace traditional classroom education in universities in the near future. To what extent do you agree or disagree with this statement?',
    minWordCount: 250,
    recommendedTimeMinutes: 40
  },
  {
    id: 'task2-environment-carbon',
    title: 'Environmental Responsibility',
    type: 'TASK_2_ESSAY',
    category: 'Environment & Policy',
    questionText: 'Some people argue that individuals should take personal responsibility for reducing global pollution, while others believe that major corporations and national governments should bear full responsibility. Discuss both views and give your opinion.',
    minWordCount: 250,
    recommendedTimeMinutes: 40
  },
  {
    id: 'task2-globalization-culture',
    title: 'Globalization & Local Traditions',
    type: 'TASK_2_ESSAY',
    category: 'Culture & Society',
    questionText: 'Globalization has allowed foreign products and cultural trends to dominate domestic markets. Do the advantages of this trend outweigh the disadvantages?',
    minWordCount: 250,
    recommendedTimeMinutes: 40
  },
  {
    id: 'task1-acad-water-consumption',
    title: 'Global Water Usage (1900–2000)',
    type: 'TASK_1_ACADEMIC',
    category: 'Line Graph & Data Chart',
    chartDescription: 'The graph below illustrates global water consumption in three sectors (Agriculture, Industrial, and Domestic) from 1900 to 2000.',
    questionText: 'Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    minWordCount: 150,
    recommendedTimeMinutes: 20
  },
  {
    id: 'task1-acad-electricity-production',
    title: 'Electricity Production by Source',
    type: 'TASK_1_ACADEMIC',
    category: 'Bar Chart & Comparison',
    chartDescription: 'The bar chart compares the percentage of electricity generated from fossil fuels, nuclear power, and renewable resources in four European nations in 2020.',
    questionText: 'Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    minWordCount: 150,
    recommendedTimeMinutes: 20
  },
  {
    id: 'task1-gen-accommodation-complaint',
    title: 'Letter to Rental Agency',
    type: 'TASK_1_GENERAL',
    category: 'Formal Complaint Letter',
    questionText: 'You recently rented an apartment through a housing agency, but you have experienced several maintenance issues that have not been fixed despite your initial requests.\n\nWrite a letter to the manager of the rental agency. In your letter:\n- Explain the details of your apartment and lease\n- Describe the specific maintenance problems\n- State what action you expect the manager to take immediately.',
    minWordCount: 150,
    recommendedTimeMinutes: 20
  }
];
