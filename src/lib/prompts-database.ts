import { IELTSTaskPrompt } from '@/types/ielts';

/**
 * OFFICIAL PROMPTS DATABASE
 * Contains all 160 authentic IELTS Writing prompts (150 Task 2 Essays + 10 Task 1 Tasks).
 * Serves as both the default database for Supabase seeding and the zero-dependency
 * offline/failover database for static or disconnected environments.
 */
export const OFFICIAL_PROMPTS_DATABASE: IELTSTaskPrompt[] = [
  {
    "id": "task2-001-online-degrees-vs-traditional-un",
    "title": "Online Degrees vs Traditional University",
    "type": "TASK_2_ESSAY",
    "category": "Education & Higher Learning (Agree / Disagree)",
    "questionText": "Some people believe that online university degrees will soon completely replace traditional on-campus education. To what extent do you agree or disagree with this prediction?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-002-free-higher-education-funded-by-",
    "title": "Free Higher Education Funded by Governments",
    "type": "TASK_2_ESSAY",
    "category": "Education & Higher Learning (Discuss Both Views & Opinion)",
    "questionText": "Some people think that university education should be completely free for all qualified students, paid for by the government. Others argue that students should fund their own higher education as it primarily benefits their individual careers. Discuss both views and give your opinion.",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-003-practical-job-skills-vs-theoreti",
    "title": "Practical Job Skills vs Theoretical Academics",
    "type": "TASK_2_ESSAY",
    "category": "Education & Higher Learning (Discuss Both Views & Opinion)",
    "questionText": "Some educators believe that schools and colleges should focus primarily on teaching practical vocational skills needed for employment. Others think education should prioritize theoretical knowledge and broad intellectual disciplines. Discuss both views and give your opinion.",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-004-single-sex-vs-co-educational-sch",
    "title": "Single-Sex vs Co-Educational Schools",
    "type": "TASK_2_ESSAY",
    "category": "Education & Higher Learning (Advantages vs Disadvantages)",
    "questionText": "In some countries, many parents choose to send their children to single-sex schools. Do the advantages of single-sex education outweigh the disadvantages?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-005-mandatory-physical-education-in-",
    "title": "Mandatory Physical Education in Curricula",
    "type": "TASK_2_ESSAY",
    "category": "Education & Higher Learning (Agree / Disagree)",
    "questionText": "All primary and secondary schools should make physical education and sport compulsory every school day until graduation. To what extent do you agree or disagree?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-006-school-homework-quantity-for-chi",
    "title": "School Homework Quantity for Children",
    "type": "TASK_2_ESSAY",
    "category": "Education & Higher Learning (Discuss Both Views & Opinion)",
    "questionText": "Some people argue that daily homework puts unnecessary stress on young children and should be banned. Others believe homework is essential for reinforcing classroom learning and developing self-discipline. Discuss both views and give your opinion.",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-007-foreign-language-learning-in-ear",
    "title": "Foreign Language Learning in Early Childhood",
    "type": "TASK_2_ESSAY",
    "category": "Education & Higher Learning (To What Extent)",
    "questionText": "Some experts recommend that children should begin learning a foreign language in primary school rather than secondary school. Do the advantages of early foreign language acquisition outweigh its drawbacks?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-008-financial-literacy-personal-fina",
    "title": "Financial Literacy & Personal Finance Education",
    "type": "TASK_2_ESSAY",
    "category": "Education & Higher Learning (Agree / Disagree)",
    "questionText": "Schools should teach children how to manage money, budget, and invest as a compulsory subject alongside mathematics and science. To what extent do you agree or disagree?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-009-teacher-performance-linked-to-st",
    "title": "Teacher Performance Linked to Student Exam Results",
    "type": "TASK_2_ESSAY",
    "category": "Education & Higher Learning (Advantages vs Disadvantages)",
    "questionText": "Some countries propose evaluating teachers and determining their salary bonuses based on their students' standardized examination scores. Do the advantages of this policy outweigh the disadvantages?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-010-arts-music-and-drama-in-school-c",
    "title": "Arts, Music and Drama in School Curricula",
    "type": "TASK_2_ESSAY",
    "category": "Education & Higher Learning (Agree / Disagree)",
    "questionText": "Subjects like art, music, and drama are often considered less important than science, technology, and math (STEM). Some argue arts education is a waste of school resources. To what extent do you agree or disagree?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-011-streaming-by-ability-vs-mixed-ab",
    "title": "Streaming by Ability vs Mixed-Ability Classes",
    "type": "TASK_2_ESSAY",
    "category": "Education & Higher Learning (Discuss Both Views & Opinion)",
    "questionText": "Some educational institutions group students into classrooms based on their academic ability, while others believe students of all abilities should study together. Discuss both views and give your opinion.",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-012-gap-year-before-university",
    "title": "Gap Year Before University",
    "type": "TASK_2_ESSAY",
    "category": "Education & Higher Learning (Advantages vs Disadvantages)",
    "questionText": "An increasing number of secondary school graduates take a gap year to work or travel before starting university. Do the advantages of taking a gap year outweigh the disadvantages?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-013-parental-responsibility-for-scho",
    "title": "Parental Responsibility for School Discipline",
    "type": "TASK_2_ESSAY",
    "category": "Education & Higher Learning (Two-Part Question)",
    "questionText": "In many countries, discipline problems and student misconduct in classrooms are rising. What are the main causes of this problem, and who should take the primary responsibility for resolving it: parents or teachers?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-014-standardized-examinations-vs-con",
    "title": "Standardized Examinations vs Continuous Assessment",
    "type": "TASK_2_ESSAY",
    "category": "Education & Higher Learning (Discuss Both Views & Opinion)",
    "questionText": "Some educators believe formal final examinations are the most equitable way to assess student knowledge. Others argue continuous assessment through coursework and projects gives a fairer reflection of ability. Discuss both views and give your opinion.",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-015-university-quotas-for-underrepre",
    "title": "University Quotas for Underrepresented Groups",
    "type": "TASK_2_ESSAY",
    "category": "Education & Higher Learning (Agree / Disagree)",
    "questionText": "Universities should accept equal numbers of male and female students in every subject, regardless of individual application test scores. To what extent do you agree or disagree?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-016-artificial-intelligence-mass-une",
    "title": "Artificial Intelligence & Mass Unemployment",
    "type": "TASK_2_ESSAY",
    "category": "Technology, AI & Digital Life (Discuss Both Views & Opinion)",
    "questionText": "Some economists predict that generative AI and robotics will eliminate millions of professional jobs, causing catastrophic unemployment. Others believe AI will create brand new industries and elevate human productivity. Discuss both views and give your opinion.",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-017-social-media-impact-on-human-int",
    "title": "Social Media Impact on Human Interaction",
    "type": "TASK_2_ESSAY",
    "category": "Technology, AI & Digital Life (Discuss Both Views & Opinion)",
    "questionText": "Social networking websites have allowed people to connect globally like never before. However, critics argue these platforms make people more isolated and anti-social in real life. Discuss both views and give your opinion.",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-018-children-and-smartphone-screen-t",
    "title": "Children and Smartphone Screen Time",
    "type": "TASK_2_ESSAY",
    "category": "Technology, AI & Digital Life (Causes & Solutions)",
    "questionText": "Young children are spending an unprecedented number of hours per day staring at smartphone and tablet screens. What are the primary reasons for this trend, and what measures can parents and governments adopt to minimize its harmful effects?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-019-automated-surveillance-public-pr",
    "title": "Automated Surveillance & Public Privacy",
    "type": "TASK_2_ESSAY",
    "category": "Technology, AI & Digital Life (Agree / Disagree)",
    "questionText": "The widespread installation of public CCTV cameras and facial recognition technology reduces crime significantly, making the loss of personal privacy fully justified. To what extent do you agree or disagree?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-020-cashless-societies-digital-payme",
    "title": "Cashless Societies & Digital Payments",
    "type": "TASK_2_ESSAY",
    "category": "Technology, AI & Digital Life (Advantages vs Disadvantages)",
    "questionText": "Many nations are moving towards a completely cashless economy where all financial transactions occur digitally. Do the advantages of a cashless society outweigh the disadvantages?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-021-autonomous-vehicles-self-driving",
    "title": "Autonomous Vehicles & Self-Driving Cars",
    "type": "TASK_2_ESSAY",
    "category": "Technology, AI & Digital Life (Advantages vs Disadvantages)",
    "questionText": "In the near future, driverless cars are expected to dominate urban roads. Do the advantages of autonomous transport outweigh the potential safety and ethical disadvantages?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-022-printed-books-and-libraries-vs-e",
    "title": "Printed Books and Libraries vs E-Books",
    "type": "TASK_2_ESSAY",
    "category": "Technology, AI & Digital Life (To What Extent)",
    "questionText": "With the rise of internet search engines and e-books, public libraries and paper books have become obsolete and represent an unnecessary public expenditure. To what extent do you agree or disagree?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-023-cyberbullying-and-internet-anony",
    "title": "Cyberbullying and Internet Anonymity",
    "type": "TASK_2_ESSAY",
    "category": "Technology, AI & Digital Life (Problem & Solution)",
    "questionText": "Online harassment and cyberbullying have become pervasive problems worldwide. What are the factors contributing to cyberbullying, and should internet users be required to register with real legal identities to prevent it?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-024-robotic-automation-in-elderly-he",
    "title": "Robotic Automation in Elderly Healthcare",
    "type": "TASK_2_ESSAY",
    "category": "Technology, AI & Digital Life (Advantages vs Disadvantages)",
    "questionText": "As populations age, some healthcare systems are deploying companion robots and automated machines to care for elderly citizens. Do the advantages of robotic caregiving outweigh its drawbacks?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-025-video-games-and-youth-violence",
    "title": "Video Games and Youth Violence",
    "type": "TASK_2_ESSAY",
    "category": "Technology, AI & Digital Life (Discuss Both Views & Opinion)",
    "questionText": "Some psychologists claim that playing violent video games promotes aggressive antisocial behavior in adolescents. Others believe video games are harmless entertainment that sharpens strategic reflexes. Discuss both views and give your opinion.",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-026-personal-data-collection-by-tech",
    "title": "Personal Data Collection by Tech Monopolies",
    "type": "TASK_2_ESSAY",
    "category": "Technology, AI & Digital Life (Agree / Disagree)",
    "questionText": "Large technology corporations collect massive volumes of personal data from users in exchange for free digital services. Governments should heavily regulate or prohibit this practice. To what extent do you agree or disagree?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-027-space-colonization-vs-earth-sust",
    "title": "Space Colonization vs Earth Sustainability",
    "type": "TASK_2_ESSAY",
    "category": "Technology, AI & Digital Life (Agree / Disagree)",
    "questionText": "Billions of dollars are spent attempting to explore and colonize Mars and outer space. Some argue that all space funding should be redirected towards addressing climate change and poverty on Earth. To what extent do you agree or disagree?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-028-telemedicine-remote-medical-cons",
    "title": "Telemedicine & Remote Medical Consultations",
    "type": "TASK_2_ESSAY",
    "category": "Technology, AI & Digital Life (Advantages vs Disadvantages)",
    "questionText": "Many patients now consult doctors through digital video apps rather than visiting a clinic in person. Do the advantages of virtual telemedicine outweigh its disadvantages?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-029-impact-of-digital-automation-on-",
    "title": "Impact of Digital Automation on Traditional Crafts",
    "type": "TASK_2_ESSAY",
    "category": "Technology, AI & Digital Life (Two-Part Question)",
    "questionText": "Modern mass production and automated 3D manufacturing are causing traditional handcrafts and artisan trades to disappear. Why is this happening, and is it important to preserve traditional handcrafted production?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-030-the-right-to-disconnect-from-wor",
    "title": "The Right to Disconnect from Work Communication",
    "type": "TASK_2_ESSAY",
    "category": "Technology, AI & Digital Life (Agree / Disagree)",
    "questionText": "Due to smartphones and emails, many employees are expected to respond to work messages outside office hours. Laws should be introduced to give workers a legal 'right to disconnect'. To what extent do you agree or disagree?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-031-individual-responsibility-vs-gov",
    "title": "Individual Responsibility vs Government Action for Climate",
    "type": "TASK_2_ESSAY",
    "category": "Environment, Climate & Energy (Discuss Both Views & Opinion)",
    "questionText": "Some people believe that individual lifestyle changes (such as recycling and using public transit) are the key to reversing climate change. Others argue only government legislation and corporate regulation can make a meaningful difference. Discuss both views and give your opinion.",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-032-nuclear-energy-as-a-clean-altern",
    "title": "Nuclear Energy as a Clean Alternative",
    "type": "TASK_2_ESSAY",
    "category": "Environment, Climate & Energy (Advantages vs Disadvantages)",
    "questionText": "To replace fossil fuels and combat global warming, several nations are constructing new nuclear power stations. Do the advantages of nuclear energy outweigh the potential environmental risks?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-033-single-use-plastics-total-ban",
    "title": "Single-Use Plastics Total Ban",
    "type": "TASK_2_ESSAY",
    "category": "Environment, Climate & Energy (Agree / Disagree)",
    "questionText": "Plastic pollution in oceans and landfills has reached alarming levels. Governments should enforce an outright ban on all single-use plastic packaging and consumer products. To what extent do you agree or disagree?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-034-protecting-endangered-species-vs",
    "title": "Protecting Endangered Species vs Human Needs",
    "type": "TASK_2_ESSAY",
    "category": "Environment, Climate & Energy (Discuss Both Views & Opinion)",
    "questionText": "Some people argue that massive public funds should be spent saving endangered animal and plant species from extinction. Others argue human needs, such as healthcare and housing, must take absolute priority. Discuss both views and give your opinion.",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-035-deforestation-for-agricultural-e",
    "title": "Deforestation for Agricultural Expansion",
    "type": "TASK_2_ESSAY",
    "category": "Environment, Climate & Energy (Causes & Solutions)",
    "questionText": "Vast areas of tropical rainforest are cleared every year to provide pasture for cattle and land for crops. What environmental problems does deforestation cause, and how can the international community halt this destruction while feeding growing populations?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-036-taxing-fossil-fuel-vehicles-subs",
    "title": "Taxing Fossil Fuel Vehicles & Subsidizing EVs",
    "type": "TASK_2_ESSAY",
    "category": "Environment, Climate & Energy (Agree / Disagree)",
    "questionText": "Governments should levy heavy carbon taxes on petrol and diesel vehicles while subsidizing electric cars to accelerate green transport transition. To what extent do you agree or disagree?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-037-throwaway-consumer-culture-waste",
    "title": "Throwaway Consumer Culture & Waste Management",
    "type": "TASK_2_ESSAY",
    "category": "Environment, Climate & Energy (Causes & Solutions)",
    "questionText": "Modern consumer society encourages people to purchase cheap goods and discard them quickly, resulting in unprecedented waste mountains. What are the causes of this throwaway culture, and how can society transition to a circular economy?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-038-renewable-energy-transition-in-d",
    "title": "Renewable Energy Transition in Developing Economies",
    "type": "TASK_2_ESSAY",
    "category": "Environment, Climate & Energy (Discuss Both Views & Opinion)",
    "questionText": "Some argue developing countries should be allowed to use cheap fossil fuels until their economies mature. Others maintain all countries must transition immediately to renewable wind and solar power regardless of economic status. Discuss both views and give your opinion.",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-039-global-water-scarcity-industrial",
    "title": "Global Water Scarcity & Industrial Depletion",
    "type": "TASK_2_ESSAY",
    "category": "Environment, Climate & Energy (Problem & Solution)",
    "questionText": "Fresh drinking water shortages are becoming critical in many arid regions due to industrial overuse and changing climate patterns. What consequences will water scarcity have, and what global measures can be implemented to conserve freshwater resources?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-040-aviation-fuel-taxation-and-fligh",
    "title": "Aviation Fuel Taxation and Flight Limits",
    "type": "TASK_2_ESSAY",
    "category": "Environment, Climate & Energy (To What Extent)",
    "questionText": "Commercial air travel is one of the fastest-growing sources of greenhouse gas emissions. Some propose increasing airfare taxes drastically to discourage non-essential holiday flights. To what extent do you agree or disagree?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-041-zoos-and-wild-animal-captivity",
    "title": "Zoos and Wild Animal Captivity",
    "type": "TASK_2_ESSAY",
    "category": "Environment, Climate & Energy (Discuss Both Views & Opinion)",
    "questionText": "Some people believe keeping wild animals in zoos is cruel and obsolete in the 21st century. Others argue zoos play a vital role in biological research and species conservation. Discuss both views and give your opinion.",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-042-meat-consumption-and-global-envi",
    "title": "Meat Consumption and Global Environmental Footprint",
    "type": "TASK_2_ESSAY",
    "category": "Environment, Climate & Energy (Agree / Disagree)",
    "questionText": "The industrial livestock industry generates more greenhouse gases than the entire global transportation sector. People should adopt a plant-based diet to protect the planet. To what extent do you agree or disagree?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-043-urban-green-spaces-and-biodivers",
    "title": "Urban Green Spaces and Biodiversity Parks",
    "type": "TASK_2_ESSAY",
    "category": "Environment, Climate & Energy (Advantages vs Disadvantages)",
    "questionText": "Many municipal councils are converting valuable commercial real estate in city centers into public parks, forests, and biodiversity reserves. Do the environmental and health advantages outweigh the economic costs?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-044-fast-fashion-impact-on-global-ec",
    "title": "Fast Fashion Impact on Global Ecosystems",
    "type": "TASK_2_ESSAY",
    "category": "Environment, Climate & Energy (Causes & Solutions)",
    "questionText": "The rapid production of cheap, disposable fashion clothing causes tremendous water pollution, toxic chemical waste, and textile dumping. Why has fast fashion become so popular, and what actions can be taken to promote sustainable clothing?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-045-international-treaties-vs-nation",
    "title": "International Treaties vs National Economic Growth",
    "type": "TASK_2_ESSAY",
    "category": "Environment, Climate & Energy (Agree / Disagree)",
    "questionText": "Strict international environmental treaties limit the economic development of sovereign nations. Individual countries should be free to set their own environmental regulations. To what extent do you agree or disagree?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-046-taxing-sugary-drinks-ultra-proce",
    "title": "Taxing Sugary Drinks & Ultra-Processed Foods",
    "type": "TASK_2_ESSAY",
    "category": "Health, Diet & Public Healthcare (Agree / Disagree)",
    "questionText": "Governments should introduce a high tax on fast food and sugar-sweetened beverages to discourage unhealthy eating and fund public healthcare. To what extent do you agree or disagree?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-047-free-universal-healthcare-vs-pri",
    "title": "Free Universal Healthcare vs Private Insurance",
    "type": "TASK_2_ESSAY",
    "category": "Health, Diet & Public Healthcare (Discuss Both Views & Opinion)",
    "questionText": "Some argue comprehensive healthcare should be a fundamental human right fully funded by general taxation. Others believe private medical insurance provides higher quality care and reduces state debt. Discuss both views and give your opinion.",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-048-rising-obesity-rates-among-child",
    "title": "Rising Obesity Rates Among Children",
    "type": "TASK_2_ESSAY",
    "category": "Health, Diet & Public Healthcare (Causes & Solutions)",
    "questionText": "Obesity among children and teenagers has increased dramatically over the past three decades. What are the main drivers of this health epidemic, and what practical strategies can schools and families implement to reverse it?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-049-preventive-healthcare-vs-hospita",
    "title": "Preventive Healthcare vs Hospital Treatment Funding",
    "type": "TASK_2_ESSAY",
    "category": "Health, Diet & Public Healthcare (To What Extent)",
    "questionText": "Governments spend the majority of their health budgets treating existing diseases in hospitals. It would be far more effective to invest heavily in public health campaigns promoting healthy diets and regular exercise. To what extent do you agree or disagree?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-050-mental-health-awareness-public-i",
    "title": "Mental Health Awareness & Public Investment",
    "type": "TASK_2_ESSAY",
    "category": "Health, Diet & Public Healthcare (Discuss Both Views & Opinion)",
    "questionText": "In many countries, mental health disorders are now recognized as a leading cause of disability. Some believe mental health treatment deserves equal government funding to physical illness, while others prioritize physical emergency care. Discuss both views and give your opinion.",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-051-sedentary-lifestyles-and-office-",
    "title": "Sedentary Lifestyles and Office Ergonomics",
    "type": "TASK_2_ESSAY",
    "category": "Health, Diet & Public Healthcare (Causes & Solutions)",
    "questionText": "Modern desk-bound office jobs and digital entertainment have created an increasingly sedentary population, leading to chronic illness. What factors encourage this inactive lifestyle, and how can employers and communities foster physical activity?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-052-banning-tobacco-and-vaping-produ",
    "title": "Banning Tobacco and Vaping Products Completely",
    "type": "TASK_2_ESSAY",
    "category": "Health, Diet & Public Healthcare (Agree / Disagree)",
    "questionText": "Given the catastrophic health consequences and medical costs associated with smoking and vaping, all nicotine products should be made completely illegal. To what extent do you agree or disagree?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-053-pharmaceutical-patent-monopolies",
    "title": "Pharmaceutical Patent Monopolies & Drug Pricing",
    "type": "TASK_2_ESSAY",
    "category": "Health, Diet & Public Healthcare (Discuss Both Views & Opinion)",
    "questionText": "Some argue pharmaceutical companies should hold exclusive patents on life-saving medicines to reward expensive research and development. Others believe essential medicines should be sold at affordable production cost worldwide. Discuss both views and give your opinion.",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-054-longevity-and-centenarian-aging-",
    "title": "Longevity and Centenarian Aging Populations",
    "type": "TASK_2_ESSAY",
    "category": "Health, Diet & Public Healthcare (Advantages vs Disadvantages)",
    "questionText": "Due to medical advancements, average life expectancy is exceeding 80 years in many countries. Do the advantages of an increasingly long-lived population outweigh the socio-economic disadvantages?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-055-alternative-holistic-medicine-vs",
    "title": "Alternative Holistic Medicine vs Scientific Medicine",
    "type": "TASK_2_ESSAY",
    "category": "Health, Diet & Public Healthcare (Discuss Both Views & Opinion)",
    "questionText": "Some individuals prefer relying on herbal, homeopathic, or holistic remedies for health issues. Others argue only scientifically validated modern medicine should be practiced and licensed. Discuss both views and give your opinion.",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-056-compulsory-childhood-vaccination",
    "title": "Compulsory Childhood Vaccinations",
    "type": "TASK_2_ESSAY",
    "category": "Health, Diet & Public Healthcare (Agree / Disagree)",
    "questionText": "Governments should mandate that all children receive standard routine immunizations before being admitted to public schools. To what extent do you agree or disagree?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-057-advertising-fast-food-to-childre",
    "title": "Advertising Fast Food to Children",
    "type": "TASK_2_ESSAY",
    "category": "Health, Diet & Public Healthcare (Agree / Disagree)",
    "questionText": "Television and internet commercials advertising junk food and sugary snacks aimed at children should be completely banned by law. To what extent do you agree or disagree?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-058-personal-responsibility-for-illn",
    "title": "Personal Responsibility for Illness & Healthcare Charges",
    "type": "TASK_2_ESSAY",
    "category": "Health, Diet & Public Healthcare (Discuss Both Views & Opinion)",
    "questionText": "Some propose that individuals who smoke, drink heavily, or neglect their fitness should pay higher taxes or direct medical fees for treatment. Others argue state healthcare must treat all citizens without moral discrimination. Discuss both views and give your opinion.",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-059-stress-and-burnout-in-high-incom",
    "title": "Stress and Burnout in High-Income Societies",
    "type": "TASK_2_ESSAY",
    "category": "Health, Diet & Public Healthcare (Causes & Solutions)",
    "questionText": "Despite high material standards of living, people in developed countries report rising rates of psychological stress and workplace burnout. What factors cause this paradox, and what lifestyle or structural adjustments can relieve it?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-060-genetically-modified-foods-gmos-",
    "title": "Genetically Modified Foods (GMOs) and Global Hunger",
    "type": "TASK_2_ESSAY",
    "category": "Health, Diet & Public Healthcare (Advantages vs Disadvantages)",
    "questionText": "Genetically modified crops can withstand droughts and pests, potentially ending global food shortages. Do the agricultural benefits of genetically engineered food outweigh potential health and ecological risks?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-061-elderly-care-family-homes-vs-pro",
    "title": "Elderly Care: Family Homes vs Professional Care Centers",
    "type": "TASK_2_ESSAY",
    "category": "Society, Family & Demographics (Discuss Both Views & Opinion)",
    "questionText": "Some believe adult children have a moral obligation to care for aging parents in their own homes. Others argue specialized retirement homes and professional geriatric facilities offer superior medical and social care. Discuss both views and give your opinion.",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-062-decline-in-birth-rates-in-develo",
    "title": "Decline in Birth Rates in Developed Nations",
    "type": "TASK_2_ESSAY",
    "category": "Society, Family & Demographics (Causes & Consequences)",
    "questionText": "Many industrialized countries are experiencing historically low birth rates, leading to shrinking and aging populations. What are the causes of this demographic decline, and what consequences will it have for society and the economy?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-063-nuclear-families-vs-extended-mul",
    "title": "Nuclear Families vs Extended Multi-Generational Living",
    "type": "TASK_2_ESSAY",
    "category": "Society, Family & Demographics (Advantages vs Disadvantages)",
    "questionText": "In many modern cultures, multi-generational households have been replaced by small nuclear family units living independently. Do the advantages of this living arrangement outweigh the disadvantages?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-064-parenthood-delay-for-career-esta",
    "title": "Parenthood Delay for Career Establishment",
    "type": "TASK_2_ESSAY",
    "category": "Society, Family & Demographics (Advantages vs Disadvantages)",
    "questionText": "Young adults are increasingly postponing marriage and having children until their thirties or forties to establish professional careers. Do the benefits of delayed parenthood outweigh the drawbacks?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-065-equal-parental-leave-for-fathers",
    "title": "Equal Parental Leave for Fathers and Mothers",
    "type": "TASK_2_ESSAY",
    "category": "Society, Family & Demographics (Agree / Disagree)",
    "questionText": "Employers should offer identical paid parental leave durations to both fathers and mothers following the birth or adoption of a child. To what extent do you agree or disagree?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-066-wealth-disparity-income-inequali",
    "title": "Wealth Disparity & Income Inequality",
    "type": "TASK_2_ESSAY",
    "category": "Society, Family & Demographics (Problem & Solution)",
    "questionText": "The gap between the richest individuals and the poorest members of society continues to widen in both developed and emerging nations. What societal problems arise from extreme income inequality, and what fiscal policies can narrow this divide?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-067-living-alone-as-a-single-person-",
    "title": "Living Alone as a Single-Person Household",
    "type": "TASK_2_ESSAY",
    "category": "Society, Family & Demographics (Advantages vs Disadvantages)",
    "questionText": "In large metropolitan cities, a record proportion of adults now live alone in single-person apartments. Do the advantages of living alone outweigh the social and emotional disadvantages?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-068-loss-of-community-spirit-in-urba",
    "title": "Loss of Community Spirit in Urban Neighborhoods",
    "type": "TASK_2_ESSAY",
    "category": "Society, Family & Demographics (Causes & Solutions)",
    "questionText": "People in modern urban apartment complexes often do not know their neighbors, resulting in a breakdown of neighborhood community bonds. Why is this occurring, and how can local councils recreate a sense of community solidarity?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-069-universal-basic-income-ubi",
    "title": "Universal Basic Income (UBI)",
    "type": "TASK_2_ESSAY",
    "category": "Society, Family & Demographics (Advantages vs Disadvantages)",
    "questionText": "Some economists advocate that governments should pay every adult citizen a regular guaranteed Universal Basic Income regardless of employment status. Do the advantages of UBI outweigh the financial risks?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-070-mandatory-community-service-for-",
    "title": "Mandatory Community Service for School Leavers",
    "type": "TASK_2_ESSAY",
    "category": "Society, Family & Demographics (To What Extent)",
    "questionText": "Young people should be required to complete one year of unpaid community or civic service upon finishing high school to cultivate social responsibility. To what extent do you agree or disagree?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-071-youth-unemployment-and-graduate-",
    "title": "Youth Unemployment and Graduate Underemployment",
    "type": "TASK_2_ESSAY",
    "category": "Society, Family & Demographics (Causes & Solutions)",
    "questionText": "In many countries, a large proportion of young university graduates struggle to find jobs matching their qualifications. What are the roots of graduate unemployment, and how can universities and governments bridge this mismatch?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-072-impact-of-advertising-on-materia",
    "title": "Impact of Advertising on Materialism in Children",
    "type": "TASK_2_ESSAY",
    "category": "Society, Family & Demographics (Agree / Disagree)",
    "questionText": "Aggressive marketing aimed at young audiences has created a hyper-materialistic culture where children equate happiness with owning luxury consumer possessions. To what extent do you agree or disagree?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-073-role-models-celebrities-vs-paren",
    "title": "Role Models: Celebrities vs Parents and Teachers",
    "type": "TASK_2_ESSAY",
    "category": "Society, Family & Demographics (Discuss Both Views & Opinion)",
    "questionText": "Some argue movie stars, musicians, and sports celebrities have the greatest influence over teenage behavior and values. Others believe parents and educators remain the primary role models. Discuss both views and give your opinion.",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-074-tradition-vs-modernity-in-social",
    "title": "Tradition vs Modernity in Social Customs",
    "type": "TASK_2_ESSAY",
    "category": "Society, Family & Demographics (Discuss Both Views & Opinion)",
    "questionText": "Some believe adhering strictly to traditional social customs and cultural etiquette preserves national identity. Others argue society must modernize and abandon outdated cultural practices. Discuss both views and give your opinion.",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-075-gender-quotas-on-corporate-board",
    "title": "Gender Quotas on Corporate Boards",
    "type": "TASK_2_ESSAY",
    "category": "Society, Family & Demographics (Agree / Disagree)",
    "questionText": "Governments should enforce legal quotas requiring commercial corporations to appoint women to at least 40% of executive board positions. To what extent do you agree or disagree?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-076-remote-working-vs-in-office-coll",
    "title": "Remote Working vs In-Office Collaboration",
    "type": "TASK_2_ESSAY",
    "category": "Work, Career & The Global Economy (Discuss Both Views & Opinion)",
    "questionText": "Some employees believe working remotely from home full-time yields superior productivity and work-life balance. Others maintain daily office attendance is indispensable for team creativity and corporate culture. Discuss both views and give your opinion.",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-077-four-day-work-week-without-pay-c",
    "title": "Four-Day Work Week Without Pay Cuts",
    "type": "TASK_2_ESSAY",
    "category": "Work, Career & The Global Economy (Advantages vs Disadvantages)",
    "questionText": "Several companies and governments are trialing a four-day work week (32 hours) with no reduction in employee pay. Do the advantages of a four-day work week outweigh the disadvantages?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-078-job-satisfaction-vs-high-salary-",
    "title": "Job Satisfaction vs High Salary Priority",
    "type": "TASK_2_ESSAY",
    "category": "Work, Career & The Global Economy (Discuss Both Views & Opinion)",
    "questionText": "When choosing a career, some people prioritize personal passion, fulfillment, and job satisfaction. Others believe earning a high salary is the only logical criteria in modern society. Discuss both views and give your opinion.",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-079-the-gig-economy-freelance-instab",
    "title": "The Gig Economy & Freelance Instability",
    "type": "TASK_2_ESSAY",
    "category": "Work, Career & The Global Economy (Advantages vs Disadvantages)",
    "questionText": "Millions of people now work in the 'gig economy' as freelance delivery riders, drivers, and contract designers rather than permanent staff. Do the flexible advantages of gig employment outweigh the lack of social benefits and job security?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-080-retirement-age-fixed-threshold-v",
    "title": "Retirement Age: Fixed Threshold vs Working Indefinitely",
    "type": "TASK_2_ESSAY",
    "category": "Work, Career & The Global Economy (Discuss Both Views & Opinion)",
    "questionText": "Some argue senior citizens should retire compulsorily at 65 to make room for younger jobseekers. Others believe people should be allowed to work as long as they remain competent and willing. Discuss both views and give your opinion.",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-081-lifelong-single-career-vs-multip",
    "title": "Lifelong Single-Career vs Multiple Career Pivots",
    "type": "TASK_2_ESSAY",
    "category": "Work, Career & The Global Economy (Advantages vs Disadvantages)",
    "questionText": "In past generations, employees stayed with a single employer or career track for their entire lives. Today, workers switch careers and industries multiple times. Do the advantages of frequent career changes outweigh the disadvantages?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-082-outsourcing-manufacturing-to-dev",
    "title": "Outsourcing Manufacturing to Developing Nations",
    "type": "TASK_2_ESSAY",
    "category": "Work, Career & The Global Economy (Advantages vs Disadvantages)",
    "questionText": "Multinational corporations regularly outsource factories and customer service jobs to developing countries with cheaper labor costs. Do the global benefits of outsourcing outweigh the domestic drawbacks?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-083-automation-of-blue-collar-vs-whi",
    "title": "Automation of Blue-Collar vs White-Collar Jobs",
    "type": "TASK_2_ESSAY",
    "category": "Work, Career & The Global Economy (Two-Part Question)",
    "questionText": "Historically, machines automated manual factory labor; today, algorithms and software automate intellectual white-collar professions. How will this trend affect workforce structures, and how can educational institutions prepare future graduates?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-084-executive-salaries-vs-regular-wo",
    "title": "Executive Salaries vs Regular Worker Wages",
    "type": "TASK_2_ESSAY",
    "category": "Work, Career & The Global Economy (Agree / Disagree)",
    "questionText": "Corporate chief executive officers (CEOs) frequently earn hundreds of times more than average employees in the same company. Governments should place a legal ceiling on executive compensation. To what extent do you agree or disagree?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-085-unpaid-internships-for-universit",
    "title": "Unpaid Internships for University Students",
    "type": "TASK_2_ESSAY",
    "category": "Work, Career & The Global Economy (Agree / Disagree)",
    "questionText": "Companies frequently hire university students as unpaid interns in exchange for work experience and professional references. Unpaid internships exploit young workers and should be banned. To what extent do you agree or disagree?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-086-globalization-and-the-homogeniza",
    "title": "Globalization and the Homogenization of Local Markets",
    "type": "TASK_2_ESSAY",
    "category": "Work, Career & The Global Economy (Discuss Both Views & Opinion)",
    "questionText": "Some argue global trade brings cheaper consumer goods and technological modernization to all regions. Others argue it wipes out local independent retailers and traditional cottage industries. Discuss both views and give your opinion.",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-087-vocational-trades-vs-academic-de",
    "title": "Vocational Trades vs Academic Degrees",
    "type": "TASK_2_ESSAY",
    "category": "Work, Career & The Global Economy (Agree / Disagree)",
    "questionText": "Society places too much prestige on university degrees and undervalues manual skilled trades like plumbing, carpentry, and electrical work. To what extent do you agree or disagree?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-088-working-long-overtime-hours-and-",
    "title": "Working Long Overtime Hours and Productivity",
    "type": "TASK_2_ESSAY",
    "category": "Work, Career & The Global Economy (Causes & Solutions)",
    "questionText": "In competitive economies, employees often work 50 to 60 hours per week despite evidence that long hours harm health and reduce productivity. Why does this culture persist, and how can companies promote balanced work schedules?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-089-entrepreneurship-training-in-hig",
    "title": "Entrepreneurship Training in High Schools",
    "type": "TASK_2_ESSAY",
    "category": "Work, Career & The Global Economy (To What Extent)",
    "questionText": "Instead of preparing students solely to be employees, high schools should actively teach entrepreneurship, business creation, and investment. To what extent do you agree or disagree?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-090-tourism-as-a-driver-of-regional-",
    "title": "Tourism as a Driver of Regional Economic Growth",
    "type": "TASK_2_ESSAY",
    "category": "Work, Career & The Global Economy (Advantages vs Disadvantages)",
    "questionText": "Many developing regions rely almost entirely on international tourism revenue to fuel their economies. Do the economic advantages of tourism dependency outweigh the environmental and cultural vulnerabilities?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-091-prison-rehabilitation-vs-retribu",
    "title": "Prison Rehabilitation vs Retributive Punishment",
    "type": "TASK_2_ESSAY",
    "category": "Crime, Law & Justice (Discuss Both Views & Opinion)",
    "questionText": "Some people believe the fundamental purpose of prison is to punish criminals for wrongdoing. Others argue correctional institutions should focus strictly on education, vocational training, and rehabilitation. Discuss both views and give your opinion.",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-092-capital-punishment-the-death-pen",
    "title": "Capital Punishment / The Death Penalty",
    "type": "TASK_2_ESSAY",
    "category": "Crime, Law & Justice (Agree / Disagree)",
    "questionText": "Capital punishment is necessary to deter heinous crimes and provide ultimate justice for victims' families. To what extent do you agree or disagree with the death penalty?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-093-juvenile-delinquency-and-youth-o",
    "title": "Juvenile Delinquency and Youth Offender Sentencing",
    "type": "TASK_2_ESSAY",
    "category": "Crime, Law & Justice (Discuss Both Views & Opinion)",
    "questionText": "Some argue teenagers under 18 who commit serious violent offenses should be tried and sentenced as adult criminals. Others believe juvenile offenders should receive community reform rather than adult prison sentences. Discuss both views and give your opinion.",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-094-white-collar-corporate-crime-vs-",
    "title": "White-Collar Corporate Crime vs Street Theft",
    "type": "TASK_2_ESSAY",
    "category": "Crime, Law & Justice (Agree / Disagree)",
    "questionText": "Financial corporate fraud, embezzlement, and insider trading inflict far greater financial and societal damage than burglary or petty theft, and should carry harsher prison sentences. To what extent do you agree or disagree?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-095-causes-of-recidivism-repeat-offe",
    "title": "Causes of Recidivism & Repeat Offending",
    "type": "TASK_2_ESSAY",
    "category": "Crime, Law & Justice (Causes & Solutions)",
    "questionText": "A high percentage of released convicts commit new offenses and return to prison within two years. What are the primary factors causing recidivism, and what rehabilitation measures can reintegrate ex-offenders into society?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-096-community-service-for-minor-non-",
    "title": "Community Service for Minor Non-Violent Offenses",
    "type": "TASK_2_ESSAY",
    "category": "Crime, Law & Justice (Advantages vs Disadvantages)",
    "questionText": "Instead of short prison sentences, some legal systems sentence minor non-violent offenders to mandatory unpaid community service. Do the advantages of community service sentences outweigh the disadvantages?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-097-gun-control-legislation-and-civi",
    "title": "Gun Control Legislation and Civilian Firearms",
    "type": "TASK_2_ESSAY",
    "category": "Crime, Law & Justice (Discuss Both Views & Opinion)",
    "questionText": "Some believe private citizens should possess a legal right to own firearms for self-defense. Others argue that strict bans on civilian firearms drastically reduce homicide rates and mass shootings. Discuss both views and give your opinion.",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-098-poverty-and-crime-rates-correlat",
    "title": "Poverty and Crime Rates Correlation",
    "type": "TASK_2_ESSAY",
    "category": "Crime, Law & Justice (Discuss Both Views & Opinion)",
    "questionText": "Some criminologists state that poverty, lack of educational opportunities, and social deprivation are the sole causes of crime. Others believe criminal actions stem from individual moral deficiency and personal greed. Discuss both views and give your opinion.",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-099-mandatory-minimum-sentences-for-",
    "title": "Mandatory Minimum Sentences for Drug Possession",
    "type": "TASK_2_ESSAY",
    "category": "Crime, Law & Justice (Advantages vs Disadvantages)",
    "questionText": "Some countries impose strict mandatory minimum prison sentences on anyone caught in possession of illegal narcotics. Do the deterrent benefits of strict drug sentencing outweigh the socio-economic costs of mass incarceration?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-100-public-media-reporting-on-violen",
    "title": "Public Media Reporting on Violent Crimes",
    "type": "TASK_2_ESSAY",
    "category": "Crime, Law & Justice (Discuss Both Views & Opinion)",
    "questionText": "Some people believe news media should report graphic details of violent crime to keep citizens vigilant. Others argue sensational crime reporting creates irrational panic and inspires copycat offenses. Discuss both views and give your opinion.",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-101-electronic-ankle-tagging-vs-inca",
    "title": "Electronic Ankle Tagging vs Incarceration",
    "type": "TASK_2_ESSAY",
    "category": "Crime, Law & Justice (Advantages vs Disadvantages)",
    "questionText": "Advances in GPS electronic tagging allow judges to place offenders under home house arrest rather than sending them to prison. Do the cost and social benefits of electronic monitoring outweigh the security risks?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-102-victim-offender-restorative-just",
    "title": "Victim-Offender Restorative Justice Programs",
    "type": "TASK_2_ESSAY",
    "category": "Crime, Law & Justice (To What Extent)",
    "questionText": "Restorative justice programs bring victims face-to-face with offenders to discuss the emotional and physical impact of the crime. To what extent do you think restorative justice is effective compared to traditional courtroom sentencing?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-103-police-body-cameras-and-accounta",
    "title": "Police Body Cameras and Accountability",
    "type": "TASK_2_ESSAY",
    "category": "Crime, Law & Justice (Advantages vs Disadvantages)",
    "questionText": "Police departments around the world now require patrol officers to wear active body cameras during all citizen interactions. Do the advantages of police body cameras outweigh the potential privacy and operational challenges?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-104-cybercrime-ransomware-and-intern",
    "title": "Cybercrime, Ransomware and International Law",
    "type": "TASK_2_ESSAY",
    "category": "Crime, Law & Justice (Problem & Solution)",
    "questionText": "Cybercrime, online financial fraud, and international ransomware attacks on infrastructure are escalating exponentially. Why is it difficult to prosecute cybercriminals, and what global treaties are needed to enforce justice across borders?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-105-parental-liability-for-juvenile-",
    "title": "Parental Liability for Juvenile Offenses",
    "type": "TASK_2_ESSAY",
    "category": "Crime, Law & Justice (Agree / Disagree)",
    "questionText": "Parents should be held legally and financially responsible for property damage and vandalism committed by their children under 16 years of age. To what extent do you agree or disagree?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-106-arts-and-culture-funding-vs-heal",
    "title": "Arts and Culture Funding vs Healthcare and Infrastructure",
    "type": "TASK_2_ESSAY",
    "category": "Government, Public Spending & Policy (Discuss Both Views & Opinion)",
    "questionText": "Some people argue governments should invest taxpayer revenue primarily in critical services like hospitals, public transport, and schools. Others believe allocating funds to art galleries, opera houses, and museums is equally essential for national identity. Discuss both views and give your opinion.",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-107-public-transit-subsidies-and-fre",
    "title": "Public Transit Subsidies and Free Commuting",
    "type": "TASK_2_ESSAY",
    "category": "Government, Public Spending & Policy (Advantages vs Disadvantages)",
    "questionText": "Several cities have made municipal bus, metro, and tram networks completely free to all passengers, funded through local taxes. Do the environmental and traffic benefits of free public transit outweigh the fiscal costs?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-108-foreign-aid-to-developing-nation",
    "title": "Foreign Aid to Developing Nations vs Domestic Spending",
    "type": "TASK_2_ESSAY",
    "category": "Government, Public Spending & Policy (Discuss Both Views & Opinion)",
    "questionText": "Some citizens believe wealthy industrialized countries have a humanitarian duty to send financial aid and medical relief to poorer countries. Others believe all government tax revenues should be spent solving domestic social problems first. Discuss both views and give your opinion.",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-109-public-parks-vs-affordable-housi",
    "title": "Public Parks vs Affordable Housing Construction",
    "type": "TASK_2_ESSAY",
    "category": "Government, Public Spending & Policy (Discuss Both Views & Opinion)",
    "questionText": "With metropolitan housing shortages, some argue public land in cities should be utilized to build affordable residential housing. Others believe urban parks, green spaces, and botanical gardens must be preserved at all costs. Discuss both views and give your opinion.",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-110-progressive-income-taxation-on-h",
    "title": "Progressive Income Taxation on High Earners",
    "type": "TASK_2_ESSAY",
    "category": "Government, Public Spending & Policy (Agree / Disagree)",
    "questionText": "To create a fairer society and fund welfare services, the wealthiest citizens should be taxed at rates up to 50% or higher. To what extent do you agree or disagree?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-111-hosting-mega-sporting-events-oly",
    "title": "Hosting Mega Sporting Events (Olympics / World Cup)",
    "type": "TASK_2_ESSAY",
    "category": "Government, Public Spending & Policy (Advantages vs Disadvantages)",
    "questionText": "Hosting international sporting spectacles like the Olympic Games or FIFA World Cup requires billions in infrastructure spending. Do the tourism and prestige advantages of hosting mega-events outweigh the immense financial costs?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-112-national-defense-budgets-vs-soci",
    "title": "National Defense Budgets vs Social Welfare Spending",
    "type": "TASK_2_ESSAY",
    "category": "Government, Public Spending & Policy (To What Extent)",
    "questionText": "Governments spend staggering portions of their national budgets on military arms, fighter jets, and defense. Some argue this money should be redirected towards eradicating poverty and funding public hospitals. To what extent do you agree or disagree?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-113-state-funding-for-scientific-res",
    "title": "State Funding for Scientific Research vs Private Investment",
    "type": "TASK_2_ESSAY",
    "category": "Government, Public Spending & Policy (Discuss Both Views & Opinion)",
    "questionText": "Some believe fundamental scientific and space research should be funded by government grants because it serves the public good. Others think commercial corporations should finance scientific innovation. Discuss both views and give your opinion.",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-114-preservation-of-historic-heritag",
    "title": "Preservation of Historic Heritage Buildings",
    "type": "TASK_2_ESSAY",
    "category": "Government, Public Spending & Policy (Advantages vs Disadvantages)",
    "questionText": "Governments spend considerable tax funds maintaining historic castles, palaces, and ancient monuments. Do the cultural and tourist advantages of historic building preservation outweigh the costs of upkeep?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-115-state-censorship-of-the-internet",
    "title": "State Censorship of the Internet and Public Media",
    "type": "TASK_2_ESSAY",
    "category": "Government, Public Spending & Policy (Agree / Disagree)",
    "questionText": "Governments have a moral obligation to censor offensive, extremist, or misleading material on the internet to protect vulnerable citizens. To what extent do you agree or disagree?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-116-congestion-charging-in-city-cent",
    "title": "Congestion Charging in City Centers",
    "type": "TASK_2_ESSAY",
    "category": "Government, Public Spending & Policy (Advantages vs Disadvantages)",
    "questionText": "To combat traffic jams, many major cities charge drivers a daily toll to enter the central commercial zone. Do the advantages of urban congestion pricing outweigh the disadvantages for commuters?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-117-mandatory-voting-laws-in-democra",
    "title": "Mandatory Voting Laws in Democratic Elections",
    "type": "TASK_2_ESSAY",
    "category": "Government, Public Spending & Policy (Agree / Disagree)",
    "questionText": "In some countries, voting in general parliamentary elections is compulsory by law, with fines issued to non-voters. Should democratic voting be mandatory for all adult citizens? Give reasons for your answer.",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-118-subsidizing-farmers-and-agricult",
    "title": "Subsidizing Farmers and Agricultural Products",
    "type": "TASK_2_ESSAY",
    "category": "Government, Public Spending & Policy (Advantages vs Disadvantages)",
    "questionText": "Many governments pay heavy annual subsidies to domestic farmers to keep food prices low and maintain food security. Do the economic advantages of farm subsidies outweigh the market distortions they create?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-119-government-incentives-for-green-",
    "title": "Government Incentives for Green Renewable Technology",
    "type": "TASK_2_ESSAY",
    "category": "Government, Public Spending & Policy (To What Extent)",
    "questionText": "Governments should offer substantial tax reductions and grants to families who install solar panels and heat pumps in their homes. To what extent do you agree or disagree?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-120-infrastructure-spending-in-rural",
    "title": "Infrastructure Spending in Rural vs Metropolitan Areas",
    "type": "TASK_2_ESSAY",
    "category": "Government, Public Spending & Policy (Discuss Both Views & Opinion)",
    "questionText": "Some argue government transport and digital infrastructure spending should prioritize large metropolises where the majority of citizens live. Others argue rural and remote regions need higher per-capita investment to prevent economic depopulation. Discuss both views and give your opinion.",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-121-impact-of-advertising-on-consume",
    "title": "Impact of Advertising on Consumer Behavior",
    "type": "TASK_2_ESSAY",
    "category": "Arts, Culture, Media & Advertising (Discuss Both Views & Opinion)",
    "questionText": "Some believe commercial advertising provides useful information about new products and fuels economic vitality. Others argue advertising manipulates consumer psychology and creates false artificial needs. Discuss both views and give your opinion.",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-122-the-dominance-of-english-as-a-gl",
    "title": "The Dominance of English as a Global Lingua Franca",
    "type": "TASK_2_ESSAY",
    "category": "Arts, Culture, Media & Advertising (Advantages vs Disadvantages)",
    "questionText": "English has become the dominant global language for international commerce, science, and the internet. Do the advantages of having one universal global language outweigh the risk of minor indigenous languages becoming extinct?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-123-celebrity-privacy-vs-public-medi",
    "title": "Celebrity Privacy vs Public Media Scrutiny",
    "type": "TASK_2_ESSAY",
    "category": "Arts, Culture, Media & Advertising (Discuss Both Views & Opinion)",
    "questionText": "Some argue famous actors, sports stars, and political figures earn exorbitant incomes and must accept intrusive media coverage of their private lives. Others believe everyone possesses a fundamental right to privacy. Discuss both views and give your opinion.",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-124-preservation-of-traditional-musi",
    "title": "Preservation of Traditional Music and Folk Art",
    "type": "TASK_2_ESSAY",
    "category": "Arts, Culture, Media & Advertising (Causes & Solutions)",
    "questionText": "Traditional indigenous music, folklore, and dance are being replaced by globalized American and western pop culture. Why is traditional folklore declining, and what measures can cultural bodies implement to keep local traditions vibrant?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-125-museum-entry-fees-vs-free-public",
    "title": "Museum Entry Fees vs Free Public Admission",
    "type": "TASK_2_ESSAY",
    "category": "Arts, Culture, Media & Advertising (Discuss Both Views & Opinion)",
    "questionText": "Some argue national museums and art galleries should charge entry fees to cover operational and maintenance costs. Others maintain public museums must be completely free of charge to promote education and culture. Discuss both views and give your opinion.",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-126-fake-news-and-social-media-infor",
    "title": "Fake News and Social Media Information Literacy",
    "type": "TASK_2_ESSAY",
    "category": "Arts, Culture, Media & Advertising (Causes & Solutions)",
    "questionText": "The rapid spread of unverified information and deliberate 'fake news' on digital networks undermines democratic elections and public health. What factors enable misinformation to spread so rapidly, and how can society cultivate critical media literacy?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-127-banning-advertising-of-luxury-go",
    "title": "Banning Advertising of Luxury Goods",
    "type": "TASK_2_ESSAY",
    "category": "Arts, Culture, Media & Advertising (Agree / Disagree)",
    "questionText": "Advertising expensive luxury items like high-end watches, luxury cars, and designer clothing creates social envy and unrealistic expectations. Some propose banning luxury marketing. To what extent do you agree or disagree?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-128-reading-fiction-novels-vs-practi",
    "title": "Reading Fiction Novels vs Practical Non-Fiction",
    "type": "TASK_2_ESSAY",
    "category": "Arts, Culture, Media & Advertising (Discuss Both Views & Opinion)",
    "questionText": "Some people believe reading literary fiction is a waste of time and that people should read factual non-fiction books to gain real knowledge. Others believe reading stories develops empathy, imagination, and language eloquence. Discuss both views and give your opinion.",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-129-preserving-minority-languages-fr",
    "title": "Preserving Minority Languages from Extinction",
    "type": "TASK_2_ESSAY",
    "category": "Arts, Culture, Media & Advertising (To What Extent)",
    "questionText": "Every month, several indigenous minority languages disappear forever. Some believe spending money to document and revive dying languages is pointless when a few global languages dominate. To what extent do you agree or disagree?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-130-digital-streaming-platforms-and-",
    "title": "Digital Streaming Platforms and Traditional Cinema",
    "type": "TASK_2_ESSAY",
    "category": "Arts, Culture, Media & Advertising (Advantages vs Disadvantages)",
    "questionText": "The proliferation of home streaming services (such as Netflix and Disney+) has led to declining attendance in public movie theaters. Do the advantages of home digital streaming outweigh the decline of community cinema culture?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-131-sponsorship-of-arts-by-private-c",
    "title": "Sponsorship of Arts by Private Corporations",
    "type": "TASK_2_ESSAY",
    "category": "Arts, Culture, Media & Advertising (Advantages vs Disadvantages)",
    "questionText": "Many modern artists, theater productions, and art exhibitions rely on commercial sponsorship from banks and corporations rather than government funding. Do the advantages of private corporate arts sponsorship outweigh the disadvantages?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-132-children-imitating-influencer-li",
    "title": "Children Imitating Influencer Lifestyles on Social Media",
    "type": "TASK_2_ESSAY",
    "category": "Arts, Culture, Media & Advertising (Problems & Solutions)",
    "questionText": "Young adolescents increasingly aspire to become online influencers rather than pursuing traditional professions like medicine, engineering, or teaching. What societal problems could this mindset cause, and how should educational institutions respond?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-133-public-art-and-graffiti-vandalis",
    "title": "Public Art and Graffiti: Vandalism or Creative Expression?",
    "type": "TASK_2_ESSAY",
    "category": "Arts, Culture, Media & Advertising (Discuss Both Views & Opinion)",
    "questionText": "Some believe unauthorized street art and graffiti is criminal vandalism that degrades neighborhoods and should be strictly penalized. Others consider street murals a valuable form of democratic cultural expression. Discuss both views and give your opinion.",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-134-international-sporting-competiti",
    "title": "International Sporting Competition as a Peace Promoter",
    "type": "TASK_2_ESSAY",
    "category": "Arts, Culture, Media & Advertising (To What Extent)",
    "questionText": "International sporting tournaments like the Olympics foster goodwill and mutual understanding between rival nations. To what extent do you agree or disagree that international sport reduces geopolitical conflict?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-135-censoring-violent-lyrics-and-exp",
    "title": "Censoring Violent Lyrics and Explicit Music",
    "type": "TASK_2_ESSAY",
    "category": "Arts, Culture, Media & Advertising (Agree / Disagree)",
    "questionText": "Songs that contain sexually explicit or violent lyrics should be banned from public radio stations and music streaming charts. To what extent do you agree or disagree?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-136-banning-private-cars-from-centra",
    "title": "Banning Private Cars from Central Metropolitan Areas",
    "type": "TASK_2_ESSAY",
    "category": "Cities, Transport & Globalization (Agree / Disagree)",
    "questionText": "To eradicate gridlock traffic and hazardous smog, municipal authorities should ban all private cars from driving within inner city centers, permitting only public buses, cycles, and pedestrians. To what extent do you agree or disagree?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-137-overtourism-and-damage-to-histor",
    "title": "Overtourism and Damage to Historic Heritage Sites",
    "type": "TASK_2_ESSAY",
    "category": "Cities, Transport & Globalization (Causes & Solutions)",
    "questionText": "Popular tourist destinations like Venice, Kyoto, and Machu Picchu suffer from severe overcrowding, rising living costs for locals, and degradation of historical monuments. What causes overtourism, and what sustainable tourism policies should be enforced?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-138-high-speed-rail-networks-vs-dome",
    "title": "High-Speed Rail Networks vs Domestic Air Travel",
    "type": "TASK_2_ESSAY",
    "category": "Cities, Transport & Globalization (Advantages vs Disadvantages)",
    "questionText": "Many countries are investing heavily in high-speed bullet train networks to replace short-haul domestic flights. Do the environmental and connectivity advantages of high-speed rail outweigh the immense engineering costs?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-139-rural-to-urban-migration-and-meg",
    "title": "Rural-to-Urban Migration and Mega-City Growth",
    "type": "TASK_2_ESSAY",
    "category": "Cities, Transport & Globalization (Causes & Consequences)",
    "questionText": "Millions of people in developing countries migrate from agrarian villages to congested mega-cities every year. What are the main drivers of rural-to-urban migration, and what consequences does this migration produce for both cities and rural communities?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-140-living-in-modern-high-rise-apart",
    "title": "Living in Modern High-Rise Apartments vs Suburban Houses",
    "type": "TASK_2_ESSAY",
    "category": "Cities, Transport & Globalization (Discuss Both Views & Opinion)",
    "questionText": "Some believe living in high-rise city apartments is the most efficient, sustainable way to house urban populations. Others argue detached houses with private gardens in quiet suburban areas offer vastly superior quality of life. Discuss both views and give your opinion.",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-141-e-scooters-and-bicycle-lanes-in-",
    "title": "E-Scooters and Bicycle Lanes in Modern Cities",
    "type": "TASK_2_ESSAY",
    "category": "Cities, Transport & Globalization (Advantages vs Disadvantages)",
    "questionText": "Many cities are replacing car lanes with dedicated paths for bicycles and electric scooters to promote green micro-mobility. Do the advantages of e-scooters and cycling lanes outweigh the safety hazards and traffic disruption?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-142-cultural-homogenization-and-glob",
    "title": "Cultural Homogenization and Global Brand Dominance",
    "type": "TASK_2_ESSAY",
    "category": "Cities, Transport & Globalization (Agree / Disagree)",
    "questionText": "Due to globalization, city shopping centers around the world look virtually identical, filled with the same international retail and fast food brands. This destroys authentic cultural uniqueness. To what extent do you agree or disagree?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-143-subsidizing-rural-relocation-to-",
    "title": "Subsidizing Rural Relocation to Decongest Megacities",
    "type": "TASK_2_ESSAY",
    "category": "Cities, Transport & Globalization (To What Extent)",
    "questionText": "Governments should offer monetary subsidies and tax holidays to businesses and families willing to move out of overcrowded capitals into declining provincial towns. To what extent do you agree or disagree?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-144-ecotourism-and-remote-environmen",
    "title": "Ecotourism and Remote Environmental Exploration",
    "type": "TASK_2_ESSAY",
    "category": "Cities, Transport & Globalization (Advantages vs Disadvantages)",
    "questionText": "Ecotourism promises to support conservation by allowing tourists to visit fragile rainforests, glaciers, and coral reefs. Do the economic and educational advantages of ecotourism outweigh the environmental damage caused by travel?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-145-public-transport-vs-expanding-hi",
    "title": "Public Transport vs Expanding Highway Networks",
    "type": "TASK_2_ESSAY",
    "category": "Cities, Transport & Globalization (Discuss Both Views & Opinion)",
    "questionText": "When tackling highway congestion, some argue governments should expand multi-lane motorways to increase vehicle capacity. Others argue building wider roads induces more traffic, and funds must be spent solely on trains and subways. Discuss both views and give your opinion.",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-146-the-15-minute-city-urban-plannin",
    "title": "The 15-Minute City Urban Planning Model",
    "type": "TASK_2_ESSAY",
    "category": "Cities, Transport & Globalization (Advantages vs Disadvantages)",
    "questionText": "The '15-minute city' urban planning concept proposes that all essential daily amenities (groceries, schools, clinics, parks, work) should be accessible within a 15-minute walk or bike ride from every home. Do the advantages of this urban model outweigh its practical challenges?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-147-international-tourism-and-cultur",
    "title": "International Tourism and Cultural Misunderstandings",
    "type": "TASK_2_ESSAY",
    "category": "Cities, Transport & Globalization (Discuss Both Views & Opinion)",
    "questionText": "Some believe international tourism breaks down cultural prejudices and builds international harmony. Others argue mass tourism leads to shallow consumerism, commercialization of sacred customs, and resentment among locals. Discuss both views and give your opinion.",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-148-gentrification-of-historic-worki",
    "title": "Gentrification of Historic Working-Class Neighborhoods",
    "type": "TASK_2_ESSAY",
    "category": "Cities, Transport & Globalization (Advantages vs Disadvantages)",
    "questionText": "In many cities, neglected working-class neighborhoods are renovated with upscale cafes and luxury developments ('gentrification'). Do the economic advantages of gentrification outweigh the displacement of long-term low-income residents?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-149-space-tourism-for-ultra-wealthy-",
    "title": "Space Tourism for Ultra-Wealthy Travelers",
    "type": "TASK_2_ESSAY",
    "category": "Cities, Transport & Globalization (Agree / Disagree)",
    "questionText": "Private aerospace firms now offer commercial sub-orbital spaceflights to wealthy tourists. Some argue space tourism causes immense carbon pollution for frivolous vanity and should be heavily taxed or prohibited. To what extent do you agree or disagree?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task2-150-air-quality-in-asian-and-global-",
    "title": "Air Quality in Asian and Global Megacities",
    "type": "TASK_2_ESSAY",
    "category": "Cities, Transport & Globalization (Causes & Solutions)",
    "questionText": "Air pollution in many global megacities frequently exceeds safe World Health Organization limits, creating severe public health crises. What are the key drivers of urban toxic smog, and what structural initiatives can restore clean air to modern metropolises?",
    "minWordCount": 250,
    "recommendedTimeMinutes": 40
  },
  {
    "id": "task1-acad-water-consumption",
    "title": "Global Water Usage (1900–2000)",
    "type": "TASK_1_ACADEMIC",
    "category": "Line Graph & Data Trends",
    "illustrationType": "LINE_GRAPH",
    "chartDescription": "The line graph below illustrates global water consumption in three distinct sectors (Agriculture, Industrial, and Domestic) from 1900 to 2000 in cubic kilometers per year.",
    "questionText": "Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    "minWordCount": 150,
    "recommendedTimeMinutes": 20
  },
  {
    "id": "task1-acad-electricity-production",
    "title": "Electricity Production by Source",
    "type": "TASK_1_ACADEMIC",
    "category": "Bar Chart & Country Comparison",
    "illustrationType": "BAR_CHART",
    "chartDescription": "The bar chart compares the percentage of electricity generated from fossil fuels, nuclear power, and renewable resources across four European nations (Germany, France, UK, and Sweden) in 2020.",
    "questionText": "Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    "minWordCount": 150,
    "recommendedTimeMinutes": 20
  },
  {
    "id": "task1-acad-household-expenditure",
    "title": "Household Spending Patterns (1980 vs 2020)",
    "type": "TASK_1_ACADEMIC",
    "category": "Pie Charts & Budget Proportions",
    "illustrationType": "PIE_CHARTS",
    "chartDescription": "The two pie charts compare the proportion of average family income spent on five essential budget categories (Food, Housing, Transport, Energy, and Recreation) in 1980 and 2020.",
    "questionText": "Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    "minWordCount": 150,
    "recommendedTimeMinutes": 20
  },
  {
    "id": "task1-acad-brick-manufacturing",
    "title": "Industrial Brick Manufacturing Process",
    "type": "TASK_1_ACADEMIC",
    "category": "Process Diagram & Linear Flowchart",
    "illustrationType": "PROCESS_DIAGRAM",
    "chartDescription": "The flowchart below illustrates the sequential industrial stages involved in manufacturing construction bricks from raw clay excavation to market delivery.",
    "questionText": "Summarise the information by selecting and reporting the main features, and describe the stages of the process where relevant.",
    "minWordCount": 150,
    "recommendedTimeMinutes": 20
  },
  {
    "id": "task1-acad-hydroelectric-dam",
    "title": "Hydroelectric Power Station Generation Cycle",
    "type": "TASK_1_ACADEMIC",
    "category": "Process Diagram & Engineering Flow",
    "illustrationType": "PROCESS_DIAGRAM",
    "chartDescription": "The diagram shows the operational mechanism and sequential cycle by which a hydroelectric dam harnesses water pressure to generate and transmit electrical power to the national grid.",
    "questionText": "Summarise the information by selecting and reporting the main features, and describe the stages of the energy generation cycle where relevant.",
    "minWordCount": 150,
    "recommendedTimeMinutes": 20
  },
  {
    "id": "task1-acad-norbiton-town-map",
    "title": "Town of Norbiton Redevelopment Plan",
    "type": "TASK_1_ACADEMIC",
    "category": "Map Comparison (Existing vs Proposed Plan)",
    "illustrationType": "MAP_COMPARISON",
    "chartDescription": "The two maps show the industrial town of Norbiton as it is currently situated, and the planned municipal redevelopment proposal for the future.",
    "questionText": "Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    "minWordCount": 150,
    "recommendedTimeMinutes": 20
  },
  {
    "id": "task1-acad-felixstone-coastal-resort",
    "title": "Coastal Village of Felixstone (1995 vs 2025)",
    "type": "TASK_1_ACADEMIC",
    "category": "Map Comparison (Historical vs Modern Resort)",
    "illustrationType": "MAP_COMPARISON",
    "chartDescription": "The two maps illustrate the transformation of the coastal village of Felixstone from a traditional fishing settlement in 1995 into a modern recreational tourist resort in 2025.",
    "questionText": "Summarise the information by selecting and reporting the main features, and make comparisons between the two time periods.",
    "minWordCount": 150,
    "recommendedTimeMinutes": 20
  },
  {
    "id": "task1-acad-tourist-destinations-table",
    "title": "International Tourist Arrivals & Revenue",
    "type": "TASK_1_ACADEMIC",
    "category": "Statistical Matrix & Data Table",
    "illustrationType": "TABLE",
    "chartDescription": "The table shows the number of international visitor arrivals (millions) and tourism revenue (billion USD) in five leading countries in 2015 and 2023.",
    "questionText": "Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    "minWordCount": 150,
    "recommendedTimeMinutes": 20
  },
  {
    "id": "task1-gen-accommodation-complaint",
    "title": "Letter to Rental Agency",
    "type": "TASK_1_GENERAL",
    "category": "Formal Complaint Letter",
    "questionText": "You recently rented an apartment through a housing agency, but you have experienced several maintenance issues that have not been fixed despite your initial requests.\n\nWrite a letter to the manager of the rental agency. In your letter:\n- Explain the details of your apartment and lease\n- Describe the specific maintenance problems\n- State what action you expect the manager to take immediately.",
    "minWordCount": 150,
    "recommendedTimeMinutes": 20
  },
  {
    "id": "task1-gen-job-application",
    "title": "Job Application Cover Letter",
    "type": "TASK_1_GENERAL",
    "category": "Professional Application Letter",
    "questionText": "You have seen an advertisement for a part-time position as a tour guide at an international heritage center in your city.\n\nWrite a letter to the recruitment director. In your letter:\n- State why you are applying for the position\n- Outline your relevant linguistic skills and customer service experience\n- Explain when you would be available for an interview and what hours you can work.",
    "minWordCount": 150,
    "recommendedTimeMinutes": 20
  },
];
