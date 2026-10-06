#!/usr/bin/env python3
"""
Generates 150 Authentic IELTS Writing Task 2 Prompts into:
1. IELTS_Writing_Task_2_150_Topics.txt
2. IELTS_Writing_Task_2_150_Topics.pdf
"""

import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

TOPICS = [
    # =========================================================================
    # 1. EDUCATION & HIGHER LEARNING (Topics 1 - 15)
    # =========================================================================
    {
        "category": "Education & Higher Learning",
        "title": "Online Degrees vs Traditional University",
        "type": "Agree / Disagree",
        "prompt": "Some people believe that online university degrees will soon completely replace traditional on-campus education. To what extent do you agree or disagree with this prediction?"
    },
    {
        "category": "Education & Higher Learning",
        "title": "Free Higher Education Funded by Governments",
        "type": "Discuss Both Views & Opinion",
        "prompt": "Some people think that university education should be completely free for all qualified students, paid for by the government. Others argue that students should fund their own higher education as it primarily benefits their individual careers. Discuss both views and give your opinion."
    },
    {
        "category": "Education & Higher Learning",
        "title": "Practical Job Skills vs Theoretical Academics",
        "type": "Discuss Both Views & Opinion",
        "prompt": "Some educators believe that schools and colleges should focus primarily on teaching practical vocational skills needed for employment. Others think education should prioritize theoretical knowledge and broad intellectual disciplines. Discuss both views and give your opinion."
    },
    {
        "category": "Education & Higher Learning",
        "title": "Single-Sex vs Co-Educational Schools",
        "type": "Advantages vs Disadvantages",
        "prompt": "In some countries, many parents choose to send their children to single-sex schools. Do the advantages of single-sex education outweigh the disadvantages?"
    },
    {
        "category": "Education & Higher Learning",
        "title": "Mandatory Physical Education in Curricula",
        "type": "Agree / Disagree",
        "prompt": "All primary and secondary schools should make physical education and sport compulsory every school day until graduation. To what extent do you agree or disagree?"
    },
    {
        "category": "Education & Higher Learning",
        "title": "School Homework Quantity for Children",
        "type": "Discuss Both Views & Opinion",
        "prompt": "Some people argue that daily homework puts unnecessary stress on young children and should be banned. Others believe homework is essential for reinforcing classroom learning and developing self-discipline. Discuss both views and give your opinion."
    },
    {
        "category": "Education & Higher Learning",
        "title": "Foreign Language Learning in Early Childhood",
        "type": "To What Extent",
        "prompt": "Some experts recommend that children should begin learning a foreign language in primary school rather than secondary school. Do the advantages of early foreign language acquisition outweigh its drawbacks?"
    },
    {
        "category": "Education & Higher Learning",
        "title": "Financial Literacy & Personal Finance Education",
        "type": "Agree / Disagree",
        "prompt": "Schools should teach children how to manage money, budget, and invest as a compulsory subject alongside mathematics and science. To what extent do you agree or disagree?"
    },
    {
        "category": "Education & Higher Learning",
        "title": "Teacher Performance Linked to Student Exam Results",
        "type": "Advantages vs Disadvantages",
        "prompt": "Some countries propose evaluating teachers and determining their salary bonuses based on their students' standardized examination scores. Do the advantages of this policy outweigh the disadvantages?"
    },
    {
        "category": "Education & Higher Learning",
        "title": "Arts, Music and Drama in School Curricula",
        "type": "Agree / Disagree",
        "prompt": "Subjects like art, music, and drama are often considered less important than science, technology, and math (STEM). Some argue arts education is a waste of school resources. To what extent do you agree or disagree?"
    },
    {
        "category": "Education & Higher Learning",
        "title": "Streaming by Ability vs Mixed-Ability Classes",
        "type": "Discuss Both Views & Opinion",
        "prompt": "Some educational institutions group students into classrooms based on their academic ability, while others believe students of all abilities should study together. Discuss both views and give your opinion."
    },
    {
        "category": "Education & Higher Learning",
        "title": "Gap Year Before University",
        "type": "Advantages vs Disadvantages",
        "prompt": "An increasing number of secondary school graduates take a gap year to work or travel before starting university. Do the advantages of taking a gap year outweigh the disadvantages?"
    },
    {
        "category": "Education & Higher Learning",
        "title": "Parental Responsibility for School Discipline",
        "type": "Two-Part Question",
        "prompt": "In many countries, discipline problems and student misconduct in classrooms are rising. What are the main causes of this problem, and who should take the primary responsibility for resolving it: parents or teachers?"
    },
    {
        "category": "Education & Higher Learning",
        "title": "Standardized Examinations vs Continuous Assessment",
        "type": "Discuss Both Views & Opinion",
        "prompt": "Some educators believe formal final examinations are the most equitable way to assess student knowledge. Others argue continuous assessment through coursework and projects gives a fairer reflection of ability. Discuss both views and give your opinion."
    },
    {
        "category": "Education & Higher Learning",
        "title": "University Quotas for Underrepresented Groups",
        "type": "Agree / Disagree",
        "prompt": "Universities should accept equal numbers of male and female students in every subject, regardless of individual application test scores. To what extent do you agree or disagree?"
    },

    # =========================================================================
    # 2. TECHNOLOGY, AI & DIGITAL LIFE (Topics 16 - 30)
    # =========================================================================
    {
        "category": "Technology, AI & Digital Life",
        "title": "Artificial Intelligence & Mass Unemployment",
        "type": "Discuss Both Views & Opinion",
        "prompt": "Some economists predict that generative AI and robotics will eliminate millions of professional jobs, causing catastrophic unemployment. Others believe AI will create brand new industries and elevate human productivity. Discuss both views and give your opinion."
    },
    {
        "category": "Technology, AI & Digital Life",
        "title": "Social Media Impact on Human Interaction",
        "type": "Discuss Both Views & Opinion",
        "prompt": "Social networking websites have allowed people to connect globally like never before. However, critics argue these platforms make people more isolated and anti-social in real life. Discuss both views and give your opinion."
    },
    {
        "category": "Technology, AI & Digital Life",
        "title": "Children and Smartphone Screen Time",
        "type": "Causes & Solutions",
        "prompt": "Young children are spending an unprecedented number of hours per day staring at smartphone and tablet screens. What are the primary reasons for this trend, and what measures can parents and governments adopt to minimize its harmful effects?"
    },
    {
        "category": "Technology, AI & Digital Life",
        "title": "Automated Surveillance & Public Privacy",
        "type": "Agree / Disagree",
        "prompt": "The widespread installation of public CCTV cameras and facial recognition technology reduces crime significantly, making the loss of personal privacy fully justified. To what extent do you agree or disagree?"
    },
    {
        "category": "Technology, AI & Digital Life",
        "title": "Cashless Societies & Digital Payments",
        "type": "Advantages vs Disadvantages",
        "prompt": "Many nations are moving towards a completely cashless economy where all financial transactions occur digitally. Do the advantages of a cashless society outweigh the disadvantages?"
    },
    {
        "category": "Technology, AI & Digital Life",
        "title": "Autonomous Vehicles & Self-Driving Cars",
        "type": "Advantages vs Disadvantages",
        "prompt": "In the near future, driverless cars are expected to dominate urban roads. Do the advantages of autonomous transport outweigh the potential safety and ethical disadvantages?"
    },
    {
        "category": "Technology, AI & Digital Life",
        "title": "Printed Books and Libraries vs E-Books",
        "type": "To What Extent",
        "prompt": "With the rise of internet search engines and e-books, public libraries and paper books have become obsolete and represent an unnecessary public expenditure. To what extent do you agree or disagree?"
    },
    {
        "category": "Technology, AI & Digital Life",
        "title": "Cyberbullying and Internet Anonymity",
        "type": "Problem & Solution",
        "prompt": "Online harassment and cyberbullying have become pervasive problems worldwide. What are the factors contributing to cyberbullying, and should internet users be required to register with real legal identities to prevent it?"
    },
    {
        "category": "Technology, AI & Digital Life",
        "title": "Robotic Automation in Elderly Healthcare",
        "type": "Advantages vs Disadvantages",
        "prompt": "As populations age, some healthcare systems are deploying companion robots and automated machines to care for elderly citizens. Do the advantages of robotic caregiving outweigh its drawbacks?"
    },
    {
        "category": "Technology, AI & Digital Life",
        "title": "Video Games and Youth Violence",
        "type": "Discuss Both Views & Opinion",
        "prompt": "Some psychologists claim that playing violent video games promotes aggressive antisocial behavior in adolescents. Others believe video games are harmless entertainment that sharpens strategic reflexes. Discuss both views and give your opinion."
    },
    {
        "category": "Technology, AI & Digital Life",
        "title": "Personal Data Collection by Tech Monopolies",
        "type": "Agree / Disagree",
        "prompt": "Large technology corporations collect massive volumes of personal data from users in exchange for free digital services. Governments should heavily regulate or prohibit this practice. To what extent do you agree or disagree?"
    },
    {
        "category": "Technology, AI & Digital Life",
        "title": "Space Colonization vs Earth Sustainability",
        "type": "Agree / Disagree",
        "prompt": "Billions of dollars are spent attempting to explore and colonize Mars and outer space. Some argue that all space funding should be redirected towards addressing climate change and poverty on Earth. To what extent do you agree or disagree?"
    },
    {
        "category": "Technology, AI & Digital Life",
        "title": "Telemedicine & Remote Medical Consultations",
        "type": "Advantages vs Disadvantages",
        "prompt": "Many patients now consult doctors through digital video apps rather than visiting a clinic in person. Do the advantages of virtual telemedicine outweigh its disadvantages?"
    },
    {
        "category": "Technology, AI & Digital Life",
        "title": "Impact of Digital Automation on Traditional Crafts",
        "type": "Two-Part Question",
        "prompt": "Modern mass production and automated 3D manufacturing are causing traditional handcrafts and artisan trades to disappear. Why is this happening, and is it important to preserve traditional handcrafted production?"
    },
    {
        "category": "Technology, AI & Digital Life",
        "title": "The Right to Disconnect from Work Communication",
        "type": "Agree / Disagree",
        "prompt": "Due to smartphones and emails, many employees are expected to respond to work messages outside office hours. Laws should be introduced to give workers a legal 'right to disconnect'. To what extent do you agree or disagree?"
    },

    # =========================================================================
    # 3. ENVIRONMENT, CLIMATE & ENERGY (Topics 31 - 45)
    # =========================================================================
    {
        "category": "Environment, Climate & Energy",
        "title": "Individual Responsibility vs Government Action for Climate",
        "type": "Discuss Both Views & Opinion",
        "prompt": "Some people believe that individual lifestyle changes (such as recycling and using public transit) are the key to reversing climate change. Others argue only government legislation and corporate regulation can make a meaningful difference. Discuss both views and give your opinion."
    },
    {
        "category": "Environment, Climate & Energy",
        "title": "Nuclear Energy as a Clean Alternative",
        "type": "Advantages vs Disadvantages",
        "prompt": "To replace fossil fuels and combat global warming, several nations are constructing new nuclear power stations. Do the advantages of nuclear energy outweigh the potential environmental risks?"
    },
    {
        "category": "Environment, Climate & Energy",
        "title": "Single-Use Plastics Total Ban",
        "type": "Agree / Disagree",
        "prompt": "Plastic pollution in oceans and landfills has reached alarming levels. Governments should enforce an outright ban on all single-use plastic packaging and consumer products. To what extent do you agree or disagree?"
    },
    {
        "category": "Environment, Climate & Energy",
        "title": "Protecting Endangered Species vs Human Needs",
        "type": "Discuss Both Views & Opinion",
        "prompt": "Some people argue that massive public funds should be spent saving endangered animal and plant species from extinction. Others argue human needs, such as healthcare and housing, must take absolute priority. Discuss both views and give your opinion."
    },
    {
        "category": "Environment, Climate & Energy",
        "title": "Deforestation for Agricultural Expansion",
        "type": "Causes & Solutions",
        "prompt": "Vast areas of tropical rainforest are cleared every year to provide pasture for cattle and land for crops. What environmental problems does deforestation cause, and how can the international community halt this destruction while feeding growing populations?"
    },
    {
        "category": "Environment, Climate & Energy",
        "title": "Taxing Fossil Fuel Vehicles & Subsidizing EVs",
        "type": "Agree / Disagree",
        "prompt": "Governments should levy heavy carbon taxes on petrol and diesel vehicles while subsidizing electric cars to accelerate green transport transition. To what extent do you agree or disagree?"
    },
    {
        "category": "Environment, Climate & Energy",
        "title": "Throwaway Consumer Culture & Waste Management",
        "type": "Causes & Solutions",
        "prompt": "Modern consumer society encourages people to purchase cheap goods and discard them quickly, resulting in unprecedented waste mountains. What are the causes of this throwaway culture, and how can society transition to a circular economy?"
    },
    {
        "category": "Environment, Climate & Energy",
        "title": "Renewable Energy Transition in Developing Economies",
        "type": "Discuss Both Views & Opinion",
        "prompt": "Some argue developing countries should be allowed to use cheap fossil fuels until their economies mature. Others maintain all countries must transition immediately to renewable wind and solar power regardless of economic status. Discuss both views and give your opinion."
    },
    {
        "category": "Environment, Climate & Energy",
        "title": "Global Water Scarcity & Industrial Depletion",
        "type": "Problem & Solution",
        "prompt": "Fresh drinking water shortages are becoming critical in many arid regions due to industrial overuse and changing climate patterns. What consequences will water scarcity have, and what global measures can be implemented to conserve freshwater resources?"
    },
    {
        "category": "Environment, Climate & Energy",
        "title": "Aviation Fuel Taxation and Flight Limits",
        "type": "To What Extent",
        "prompt": "Commercial air travel is one of the fastest-growing sources of greenhouse gas emissions. Some propose increasing airfare taxes drastically to discourage non-essential holiday flights. To what extent do you agree or disagree?"
    },
    {
        "category": "Environment, Climate & Energy",
        "title": "Zoos and Wild Animal Captivity",
        "type": "Discuss Both Views & Opinion",
        "prompt": "Some people believe keeping wild animals in zoos is cruel and obsolete in the 21st century. Others argue zoos play a vital role in biological research and species conservation. Discuss both views and give your opinion."
    },
    {
        "category": "Environment, Climate & Energy",
        "title": "Meat Consumption and Global Environmental Footprint",
        "type": "Agree / Disagree",
        "prompt": "The industrial livestock industry generates more greenhouse gases than the entire global transportation sector. People should adopt a plant-based diet to protect the planet. To what extent do you agree or disagree?"
    },
    {
        "category": "Environment, Climate & Energy",
        "title": "Urban Green Spaces and Biodiversity Parks",
        "type": "Advantages vs Disadvantages",
        "prompt": "Many municipal councils are converting valuable commercial real estate in city centers into public parks, forests, and biodiversity reserves. Do the environmental and health advantages outweigh the economic costs?"
    },
    {
        "category": "Environment, Climate & Energy",
        "title": "Fast Fashion Impact on Global Ecosystems",
        "type": "Causes & Solutions",
        "prompt": "The rapid production of cheap, disposable fashion clothing causes tremendous water pollution, toxic chemical waste, and textile dumping. Why has fast fashion become so popular, and what actions can be taken to promote sustainable clothing?"
    },
    {
        "category": "Environment, Climate & Energy",
        "title": "International Treaties vs National Economic Growth",
        "type": "Agree / Disagree",
        "prompt": "Strict international environmental treaties limit the economic development of sovereign nations. Individual countries should be free to set their own environmental regulations. To what extent do you agree or disagree?"
    },

    # =========================================================================
    # 4. HEALTH, DIET & PUBLIC HEALTHCARE (Topics 46 - 60)
    # =========================================================================
    {
        "category": "Health, Diet & Public Healthcare",
        "title": "Taxing Sugary Drinks & Ultra-Processed Foods",
        "type": "Agree / Disagree",
        "prompt": "Governments should introduce a high tax on fast food and sugar-sweetened beverages to discourage unhealthy eating and fund public healthcare. To what extent do you agree or disagree?"
    },
    {
        "category": "Health, Diet & Public Healthcare",
        "title": "Free Universal Healthcare vs Private Insurance",
        "type": "Discuss Both Views & Opinion",
        "prompt": "Some argue comprehensive healthcare should be a fundamental human right fully funded by general taxation. Others believe private medical insurance provides higher quality care and reduces state debt. Discuss both views and give your opinion."
    },
    {
        "category": "Health, Diet & Public Healthcare",
        "title": "Rising Obesity Rates Among Children",
        "type": "Causes & Solutions",
        "prompt": "Obesity among children and teenagers has increased dramatically over the past three decades. What are the main drivers of this health epidemic, and what practical strategies can schools and families implement to reverse it?"
    },
    {
        "category": "Health, Diet & Public Healthcare",
        "title": "Preventive Healthcare vs Hospital Treatment Funding",
        "type": "To What Extent",
        "prompt": "Governments spend the majority of their health budgets treating existing diseases in hospitals. It would be far more effective to invest heavily in public health campaigns promoting healthy diets and regular exercise. To what extent do you agree or disagree?"
    },
    {
        "category": "Health, Diet & Public Healthcare",
        "title": "Mental Health Awareness & Public Investment",
        "type": "Discuss Both Views & Opinion",
        "prompt": "In many countries, mental health disorders are now recognized as a leading cause of disability. Some believe mental health treatment deserves equal government funding to physical illness, while others prioritize physical emergency care. Discuss both views and give your opinion."
    },
    {
        "category": "Health, Diet & Public Healthcare",
        "title": "Sedentary Lifestyles and Office Ergonomics",
        "type": "Causes & Solutions",
        "prompt": "Modern desk-bound office jobs and digital entertainment have created an increasingly sedentary population, leading to chronic illness. What factors encourage this inactive lifestyle, and how can employers and communities foster physical activity?"
    },
    {
        "category": "Health, Diet & Public Healthcare",
        "title": "Banning Tobacco and Vaping Products Completely",
        "type": "Agree / Disagree",
        "prompt": "Given the catastrophic health consequences and medical costs associated with smoking and vaping, all nicotine products should be made completely illegal. To what extent do you agree or disagree?"
    },
    {
        "category": "Health, Diet & Public Healthcare",
        "title": "Pharmaceutical Patent Monopolies & Drug Pricing",
        "type": "Discuss Both Views & Opinion",
        "prompt": "Some argue pharmaceutical companies should hold exclusive patents on life-saving medicines to reward expensive research and development. Others believe essential medicines should be sold at affordable production cost worldwide. Discuss both views and give your opinion."
    },
    {
        "category": "Health, Diet & Public Healthcare",
        "title": "Longevity and Centenarian Aging Populations",
        "type": "Advantages vs Disadvantages",
        "prompt": "Due to medical advancements, average life expectancy is exceeding 80 years in many countries. Do the advantages of an increasingly long-lived population outweigh the socio-economic disadvantages?"
    },
    {
        "category": "Health, Diet & Public Healthcare",
        "title": "Alternative Holistic Medicine vs Scientific Medicine",
        "type": "Discuss Both Views & Opinion",
        "prompt": "Some individuals prefer relying on herbal, homeopathic, or holistic remedies for health issues. Others argue only scientifically validated modern medicine should be practiced and licensed. Discuss both views and give your opinion."
    },
    {
        "category": "Health, Diet & Public Healthcare",
        "title": "Compulsory Childhood Vaccinations",
        "type": "Agree / Disagree",
        "prompt": "Governments should mandate that all children receive standard routine immunizations before being admitted to public schools. To what extent do you agree or disagree?"
    },
    {
        "category": "Health, Diet & Public Healthcare",
        "title": "Advertising Fast Food to Children",
        "type": "Agree / Disagree",
        "prompt": "Television and internet commercials advertising junk food and sugary snacks aimed at children should be completely banned by law. To what extent do you agree or disagree?"
    },
    {
        "category": "Health, Diet & Public Healthcare",
        "title": "Personal Responsibility for Illness & Healthcare Charges",
        "type": "Discuss Both Views & Opinion",
        "prompt": "Some propose that individuals who smoke, drink heavily, or neglect their fitness should pay higher taxes or direct medical fees for treatment. Others argue state healthcare must treat all citizens without moral discrimination. Discuss both views and give your opinion."
    },
    {
        "category": "Health, Diet & Public Healthcare",
        "title": "Stress and Burnout in High-Income Societies",
        "type": "Causes & Solutions",
        "prompt": "Despite high material standards of living, people in developed countries report rising rates of psychological stress and workplace burnout. What factors cause this paradox, and what lifestyle or structural adjustments can relieve it?"
    },
    {
        "category": "Health, Diet & Public Healthcare",
        "title": "Genetically Modified Foods (GMOs) and Global Hunger",
        "type": "Advantages vs Disadvantages",
        "prompt": "Genetically modified crops can withstand droughts and pests, potentially ending global food shortages. Do the agricultural benefits of genetically engineered food outweigh potential health and ecological risks?"
    },

    # =========================================================================
    # 5. SOCIETY, FAMILY & DEMOGRAPHICS (Topics 61 - 75)
    # =========================================================================
    {
        "category": "Society, Family & Demographics",
        "title": "Elderly Care: Family Homes vs Professional Care Centers",
        "type": "Discuss Both Views & Opinion",
        "prompt": "Some believe adult children have a moral obligation to care for aging parents in their own homes. Others argue specialized retirement homes and professional geriatric facilities offer superior medical and social care. Discuss both views and give your opinion."
    },
    {
        "category": "Society, Family & Demographics",
        "title": "Decline in Birth Rates in Developed Nations",
        "type": "Causes & Consequences",
        "prompt": "Many industrialized countries are experiencing historically low birth rates, leading to shrinking and aging populations. What are the causes of this demographic decline, and what consequences will it have for society and the economy?"
    },
    {
        "category": "Society, Family & Demographics",
        "title": "Nuclear Families vs Extended Multi-Generational Living",
        "type": "Advantages vs Disadvantages",
        "prompt": "In many modern cultures, multi-generational households have been replaced by small nuclear family units living independently. Do the advantages of this living arrangement outweigh the disadvantages?"
    },
    {
        "category": "Society, Family & Demographics",
        "title": "Parenthood Delay for Career Establishment",
        "type": "Advantages vs Disadvantages",
        "prompt": "Young adults are increasingly postponing marriage and having children until their thirties or forties to establish professional careers. Do the benefits of delayed parenthood outweigh the drawbacks?"
    },
    {
        "category": "Society, Family & Demographics",
        "title": "Equal Parental Leave for Fathers and Mothers",
        "type": "Agree / Disagree",
        "prompt": "Employers should offer identical paid parental leave durations to both fathers and mothers following the birth or adoption of a child. To what extent do you agree or disagree?"
    },
    {
        "category": "Society, Family & Demographics",
        "title": "Wealth Disparity & Income Inequality",
        "type": "Problem & Solution",
        "prompt": "The gap between the richest individuals and the poorest members of society continues to widen in both developed and emerging nations. What societal problems arise from extreme income inequality, and what fiscal policies can narrow this divide?"
    },
    {
        "category": "Society, Family & Demographics",
        "title": "Living Alone as a Single-Person Household",
        "type": "Advantages vs Disadvantages",
        "prompt": "In large metropolitan cities, a record proportion of adults now live alone in single-person apartments. Do the advantages of living alone outweigh the social and emotional disadvantages?"
    },
    {
        "category": "Society, Family & Demographics",
        "title": "Loss of Community Spirit in Urban Neighborhoods",
        "type": "Causes & Solutions",
        "prompt": "People in modern urban apartment complexes often do not know their neighbors, resulting in a breakdown of neighborhood community bonds. Why is this occurring, and how can local councils recreate a sense of community solidarity?"
    },
    {
        "category": "Society, Family & Demographics",
        "title": "Universal Basic Income (UBI)",
        "type": "Advantages vs Disadvantages",
        "prompt": "Some economists advocate that governments should pay every adult citizen a regular guaranteed Universal Basic Income regardless of employment status. Do the advantages of UBI outweigh the financial risks?"
    },
    {
        "category": "Society, Family & Demographics",
        "title": "Mandatory Community Service for School Leavers",
        "type": "To What Extent",
        "prompt": "Young people should be required to complete one year of unpaid community or civic service upon finishing high school to cultivate social responsibility. To what extent do you agree or disagree?"
    },
    {
        "category": "Society, Family & Demographics",
        "title": "Youth Unemployment and Graduate Underemployment",
        "type": "Causes & Solutions",
        "prompt": "In many countries, a large proportion of young university graduates struggle to find jobs matching their qualifications. What are the roots of graduate unemployment, and how can universities and governments bridge this mismatch?"
    },
    {
        "category": "Society, Family & Demographics",
        "title": "Impact of Advertising on Materialism in Children",
        "type": "Agree / Disagree",
        "prompt": "Aggressive marketing aimed at young audiences has created a hyper-materialistic culture where children equate happiness with owning luxury consumer possessions. To what extent do you agree or disagree?"
    },
    {
        "category": "Society, Family & Demographics",
        "title": "Role Models: Celebrities vs Parents and Teachers",
        "type": "Discuss Both Views & Opinion",
        "prompt": "Some argue movie stars, musicians, and sports celebrities have the greatest influence over teenage behavior and values. Others believe parents and educators remain the primary role models. Discuss both views and give your opinion."
    },
    {
        "category": "Society, Family & Demographics",
        "title": "Tradition vs Modernity in Social Customs",
        "type": "Discuss Both Views & Opinion",
        "prompt": "Some believe adhering strictly to traditional social customs and cultural etiquette preserves national identity. Others argue society must modernize and abandon outdated cultural practices. Discuss both views and give your opinion."
    },
    {
        "category": "Society, Family & Demographics",
        "title": "Gender Quotas on Corporate Boards",
        "type": "Agree / Disagree",
        "prompt": "Governments should enforce legal quotas requiring commercial corporations to appoint women to at least 40% of executive board positions. To what extent do you agree or disagree?"
    },

    # =========================================================================
    # 6. WORK, CAREER & THE GLOBAL ECONOMY (Topics 76 - 90)
    # =========================================================================
    {
        "category": "Work, Career & The Global Economy",
        "title": "Remote Working vs In-Office Collaboration",
        "type": "Discuss Both Views & Opinion",
        "prompt": "Some employees believe working remotely from home full-time yields superior productivity and work-life balance. Others maintain daily office attendance is indispensable for team creativity and corporate culture. Discuss both views and give your opinion."
    },
    {
        "category": "Work, Career & The Global Economy",
        "title": "Four-Day Work Week Without Pay Cuts",
        "type": "Advantages vs Disadvantages",
        "prompt": "Several companies and governments are trialing a four-day work week (32 hours) with no reduction in employee pay. Do the advantages of a four-day work week outweigh the disadvantages?"
    },
    {
        "category": "Work, Career & The Global Economy",
        "title": "Job Satisfaction vs High Salary Priority",
        "type": "Discuss Both Views & Opinion",
        "prompt": "When choosing a career, some people prioritize personal passion, fulfillment, and job satisfaction. Others believe earning a high salary is the only logical criteria in modern society. Discuss both views and give your opinion."
    },
    {
        "category": "Work, Career & The Global Economy",
        "title": "The Gig Economy & Freelance Instability",
        "type": "Advantages vs Disadvantages",
        "prompt": "Millions of people now work in the 'gig economy' as freelance delivery riders, drivers, and contract designers rather than permanent staff. Do the flexible advantages of gig employment outweigh the lack of social benefits and job security?"
    },
    {
        "category": "Work, Career & The Global Economy",
        "title": "Retirement Age: Fixed Threshold vs Working Indefinitely",
        "type": "Discuss Both Views & Opinion",
        "prompt": "Some argue senior citizens should retire compulsorily at 65 to make room for younger jobseekers. Others believe people should be allowed to work as long as they remain competent and willing. Discuss both views and give your opinion."
    },
    {
        "category": "Work, Career & The Global Economy",
        "title": "Lifelong Single-Career vs Multiple Career Pivots",
        "type": "Advantages vs Disadvantages",
        "prompt": "In past generations, employees stayed with a single employer or career track for their entire lives. Today, workers switch careers and industries multiple times. Do the advantages of frequent career changes outweigh the disadvantages?"
    },
    {
        "category": "Work, Career & The Global Economy",
        "title": "Outsourcing Manufacturing to Developing Nations",
        "type": "Advantages vs Disadvantages",
        "prompt": "Multinational corporations regularly outsource factories and customer service jobs to developing countries with cheaper labor costs. Do the global benefits of outsourcing outweigh the domestic drawbacks?"
    },
    {
        "category": "Work, Career & The Global Economy",
        "title": "Automation of Blue-Collar vs White-Collar Jobs",
        "type": "Two-Part Question",
        "prompt": "Historically, machines automated manual factory labor; today, algorithms and software automate intellectual white-collar professions. How will this trend affect workforce structures, and how can educational institutions prepare future graduates?"
    },
    {
        "category": "Work, Career & The Global Economy",
        "title": "Executive Salaries vs Regular Worker Wages",
        "type": "Agree / Disagree",
        "prompt": "Corporate chief executive officers (CEOs) frequently earn hundreds of times more than average employees in the same company. Governments should place a legal ceiling on executive compensation. To what extent do you agree or disagree?"
    },
    {
        "category": "Work, Career & The Global Economy",
        "title": "Unpaid Internships for University Students",
        "type": "Agree / Disagree",
        "prompt": "Companies frequently hire university students as unpaid interns in exchange for work experience and professional references. Unpaid internships exploit young workers and should be banned. To what extent do you agree or disagree?"
    },
    {
        "category": "Work, Career & The Global Economy",
        "title": "Globalization and the Homogenization of Local Markets",
        "type": "Discuss Both Views & Opinion",
        "prompt": "Some argue global trade brings cheaper consumer goods and technological modernization to all regions. Others argue it wipes out local independent retailers and traditional cottage industries. Discuss both views and give your opinion."
    },
    {
        "category": "Work, Career & The Global Economy",
        "title": "Vocational Trades vs Academic Degrees",
        "type": "Agree / Disagree",
        "prompt": "Society places too much prestige on university degrees and undervalues manual skilled trades like plumbing, carpentry, and electrical work. To what extent do you agree or disagree?"
    },
    {
        "category": "Work, Career & The Global Economy",
        "title": "Working Long Overtime Hours and Productivity",
        "type": "Causes & Solutions",
        "prompt": "In competitive economies, employees often work 50 to 60 hours per week despite evidence that long hours harm health and reduce productivity. Why does this culture persist, and how can companies promote balanced work schedules?"
    },
    {
        "category": "Work, Career & The Global Economy",
        "title": "Entrepreneurship Training in High Schools",
        "type": "To What Extent",
        "prompt": "Instead of preparing students solely to be employees, high schools should actively teach entrepreneurship, business creation, and investment. To what extent do you agree or disagree?"
    },
    {
        "category": "Work, Career & The Global Economy",
        "title": "Tourism as a Driver of Regional Economic Growth",
        "type": "Advantages vs Disadvantages",
        "prompt": "Many developing regions rely almost entirely on international tourism revenue to fuel their economies. Do the economic advantages of tourism dependency outweigh the environmental and cultural vulnerabilities?"
    },

    # =========================================================================
    # 7. CRIME, LAW & JUSTICE (Topics 91 - 105)
    # =========================================================================
    {
        "category": "Crime, Law & Justice",
        "title": "Prison Rehabilitation vs Retributive Punishment",
        "type": "Discuss Both Views & Opinion",
        "prompt": "Some people believe the fundamental purpose of prison is to punish criminals for wrongdoing. Others argue correctional institutions should focus strictly on education, vocational training, and rehabilitation. Discuss both views and give your opinion."
    },
    {
        "category": "Crime, Law & Justice",
        "title": "Capital Punishment / The Death Penalty",
        "type": "Agree / Disagree",
        "prompt": "Capital punishment is necessary to deter heinous crimes and provide ultimate justice for victims' families. To what extent do you agree or disagree with the death penalty?"
    },
    {
        "category": "Crime, Law & Justice",
        "title": "Juvenile Delinquency and Youth Offender Sentencing",
        "type": "Discuss Both Views & Opinion",
        "prompt": "Some argue teenagers under 18 who commit serious violent offenses should be tried and sentenced as adult criminals. Others believe juvenile offenders should receive community reform rather than adult prison sentences. Discuss both views and give your opinion."
    },
    {
        "category": "Crime, Law & Justice",
        "title": "White-Collar Corporate Crime vs Street Theft",
        "type": "Agree / Disagree",
        "prompt": "Financial corporate fraud, embezzlement, and insider trading inflict far greater financial and societal damage than burglary or petty theft, and should carry harsher prison sentences. To what extent do you agree or disagree?"
    },
    {
        "category": "Crime, Law & Justice",
        "title": "Causes of Recidivism & Repeat Offending",
        "type": "Causes & Solutions",
        "prompt": "A high percentage of released convicts commit new offenses and return to prison within two years. What are the primary factors causing recidivism, and what rehabilitation measures can reintegrate ex-offenders into society?"
    },
    {
        "category": "Crime, Law & Justice",
        "title": "Community Service for Minor Non-Violent Offenses",
        "type": "Advantages vs Disadvantages",
        "prompt": "Instead of short prison sentences, some legal systems sentence minor non-violent offenders to mandatory unpaid community service. Do the advantages of community service sentences outweigh the disadvantages?"
    },
    {
        "category": "Crime, Law & Justice",
        "title": "Gun Control Legislation and Civilian Firearms",
        "type": "Discuss Both Views & Opinion",
        "prompt": "Some believe private citizens should possess a legal right to own firearms for self-defense. Others argue that strict bans on civilian firearms drastically reduce homicide rates and mass shootings. Discuss both views and give your opinion."
    },
    {
        "category": "Crime, Law & Justice",
        "title": "Poverty and Crime Rates Correlation",
        "type": "Discuss Both Views & Opinion",
        "prompt": "Some criminologists state that poverty, lack of educational opportunities, and social deprivation are the sole causes of crime. Others believe criminal actions stem from individual moral deficiency and personal greed. Discuss both views and give your opinion."
    },
    {
        "category": "Crime, Law & Justice",
        "title": "Mandatory Minimum Sentences for Drug Possession",
        "type": "Advantages vs Disadvantages",
        "prompt": "Some countries impose strict mandatory minimum prison sentences on anyone caught in possession of illegal narcotics. Do the deterrent benefits of strict drug sentencing outweigh the socio-economic costs of mass incarceration?"
    },
    {
        "category": "Crime, Law & Justice",
        "title": "Public Media Reporting on Violent Crimes",
        "type": "Discuss Both Views & Opinion",
        "prompt": "Some people believe news media should report graphic details of violent crime to keep citizens vigilant. Others argue sensational crime reporting creates irrational panic and inspires copycat offenses. Discuss both views and give your opinion."
    },
    {
        "category": "Crime, Law & Justice",
        "title": "Electronic Ankle Tagging vs Incarceration",
        "type": "Advantages vs Disadvantages",
        "prompt": "Advances in GPS electronic tagging allow judges to place offenders under home house arrest rather than sending them to prison. Do the cost and social benefits of electronic monitoring outweigh the security risks?"
    },
    {
        "category": "Crime, Law & Justice",
        "title": "Victim-Offender Restorative Justice Programs",
        "type": "To What Extent",
        "prompt": "Restorative justice programs bring victims face-to-face with offenders to discuss the emotional and physical impact of the crime. To what extent do you think restorative justice is effective compared to traditional courtroom sentencing?"
    },
    {
        "category": "Crime, Law & Justice",
        "title": "Police Body Cameras and Accountability",
        "type": "Advantages vs Disadvantages",
        "prompt": "Police departments around the world now require patrol officers to wear active body cameras during all citizen interactions. Do the advantages of police body cameras outweigh the potential privacy and operational challenges?"
    },
    {
        "category": "Crime, Law & Justice",
        "title": "Cybercrime, Ransomware and International Law",
        "type": "Problem & Solution",
        "prompt": "Cybercrime, online financial fraud, and international ransomware attacks on infrastructure are escalating exponentially. Why is it difficult to prosecute cybercriminals, and what global treaties are needed to enforce justice across borders?"
    },
    {
        "category": "Crime, Law & Justice",
        "title": "Parental Liability for Juvenile Offenses",
        "type": "Agree / Disagree",
        "prompt": "Parents should be held legally and financially responsible for property damage and vandalism committed by their children under 16 years of age. To what extent do you agree or disagree?"
    },

    # =========================================================================
    # 8. GOVERNMENT POLICY, PUBLIC SPENDING & TAXATION (Topics 106 - 120)
    # =========================================================================
    {
        "category": "Government, Public Spending & Policy",
        "title": "Arts and Culture Funding vs Healthcare and Infrastructure",
        "type": "Discuss Both Views & Opinion",
        "prompt": "Some people argue governments should invest taxpayer revenue primarily in critical services like hospitals, public transport, and schools. Others believe allocating funds to art galleries, opera houses, and museums is equally essential for national identity. Discuss both views and give your opinion."
    },
    {
        "category": "Government, Public Spending & Policy",
        "title": "Public Transit Subsidies and Free Commuting",
        "type": "Advantages vs Disadvantages",
        "prompt": "Several cities have made municipal bus, metro, and tram networks completely free to all passengers, funded through local taxes. Do the environmental and traffic benefits of free public transit outweigh the fiscal costs?"
    },
    {
        "category": "Government, Public Spending & Policy",
        "title": "Foreign Aid to Developing Nations vs Domestic Spending",
        "type": "Discuss Both Views & Opinion",
        "prompt": "Some citizens believe wealthy industrialized countries have a humanitarian duty to send financial aid and medical relief to poorer countries. Others believe all government tax revenues should be spent solving domestic social problems first. Discuss both views and give your opinion."
    },
    {
        "category": "Government, Public Spending & Policy",
        "title": "Public Parks vs Affordable Housing Construction",
        "type": "Discuss Both Views & Opinion",
        "prompt": "With metropolitan housing shortages, some argue public land in cities should be utilized to build affordable residential housing. Others believe urban parks, green spaces, and botanical gardens must be preserved at all costs. Discuss both views and give your opinion."
    },
    {
        "category": "Government, Public Spending & Policy",
        "title": "Progressive Income Taxation on High Earners",
        "type": "Agree / Disagree",
        "prompt": "To create a fairer society and fund welfare services, the wealthiest citizens should be taxed at rates up to 50% or higher. To what extent do you agree or disagree?"
    },
    {
        "category": "Government, Public Spending & Policy",
        "title": "Hosting Mega Sporting Events (Olympics / World Cup)",
        "type": "Advantages vs Disadvantages",
        "prompt": "Hosting international sporting spectacles like the Olympic Games or FIFA World Cup requires billions in infrastructure spending. Do the tourism and prestige advantages of hosting mega-events outweigh the immense financial costs?"
    },
    {
        "category": "Government, Public Spending & Policy",
        "title": "National Defense Budgets vs Social Welfare Spending",
        "type": "To What Extent",
        "prompt": "Governments spend staggering portions of their national budgets on military arms, fighter jets, and defense. Some argue this money should be redirected towards eradicating poverty and funding public hospitals. To what extent do you agree or disagree?"
    },
    {
        "category": "Government, Public Spending & Policy",
        "title": "State Funding for Scientific Research vs Private Investment",
        "type": "Discuss Both Views & Opinion",
        "prompt": "Some believe fundamental scientific and space research should be funded by government grants because it serves the public good. Others think commercial corporations should finance scientific innovation. Discuss both views and give your opinion."
    },
    {
        "category": "Government, Public Spending & Policy",
        "title": "Preservation of Historic Heritage Buildings",
        "type": "Advantages vs Disadvantages",
        "prompt": "Governments spend considerable tax funds maintaining historic castles, palaces, and ancient monuments. Do the cultural and tourist advantages of historic building preservation outweigh the costs of upkeep?"
    },
    {
        "category": "Government, Public Spending & Policy",
        "title": "State Censorship of the Internet and Public Media",
        "type": "Agree / Disagree",
        "prompt": "Governments have a moral obligation to censor offensive, extremist, or misleading material on the internet to protect vulnerable citizens. To what extent do you agree or disagree?"
    },
    {
        "category": "Government, Public Spending & Policy",
        "title": "Congestion Charging in City Centers",
        "type": "Advantages vs Disadvantages",
        "prompt": "To combat traffic jams, many major cities charge drivers a daily toll to enter the central commercial zone. Do the advantages of urban congestion pricing outweigh the disadvantages for commuters?"
    },
    {
        "category": "Government, Public Spending & Policy",
        "title": "Mandatory Voting Laws in Democratic Elections",
        "type": "Agree / Disagree",
        "prompt": "In some countries, voting in general parliamentary elections is compulsory by law, with fines issued to non-voters. Should democratic voting be mandatory for all adult citizens? Give reasons for your answer."
    },
    {
        "category": "Government, Public Spending & Policy",
        "title": "Subsidizing Farmers and Agricultural Products",
        "type": "Advantages vs Disadvantages",
        "prompt": "Many governments pay heavy annual subsidies to domestic farmers to keep food prices low and maintain food security. Do the economic advantages of farm subsidies outweigh the market distortions they create?"
    },
    {
        "category": "Government, Public Spending & Policy",
        "title": "Government Incentives for Green Renewable Technology",
        "type": "To What Extent",
        "prompt": "Governments should offer substantial tax reductions and grants to families who install solar panels and heat pumps in their homes. To what extent do you agree or disagree?"
    },
    {
        "category": "Government, Public Spending & Policy",
        "title": "Infrastructure Spending in Rural vs Metropolitan Areas",
        "type": "Discuss Both Views & Opinion",
        "prompt": "Some argue government transport and digital infrastructure spending should prioritize large metropolises where the majority of citizens live. Others argue rural and remote regions need higher per-capita investment to prevent economic depopulation. Discuss both views and give your opinion."
    },

    # =========================================================================
    # 9. ARTS, CULTURE, MEDIA & ADVERTISING (Topics 121 - 135)
    # =========================================================================
    {
        "category": "Arts, Culture, Media & Advertising",
        "title": "Impact of Advertising on Consumer Behavior",
        "type": "Discuss Both Views & Opinion",
        "prompt": "Some believe commercial advertising provides useful information about new products and fuels economic vitality. Others argue advertising manipulates consumer psychology and creates false artificial needs. Discuss both views and give your opinion."
    },
    {
        "category": "Arts, Culture, Media & Advertising",
        "title": "The Dominance of English as a Global Lingua Franca",
        "type": "Advantages vs Disadvantages",
        "prompt": "English has become the dominant global language for international commerce, science, and the internet. Do the advantages of having one universal global language outweigh the risk of minor indigenous languages becoming extinct?"
    },
    {
        "category": "Arts, Culture, Media & Advertising",
        "title": "Celebrity Privacy vs Public Media Scrutiny",
        "type": "Discuss Both Views & Opinion",
        "prompt": "Some argue famous actors, sports stars, and political figures earn exorbitant incomes and must accept intrusive media coverage of their private lives. Others believe everyone possesses a fundamental right to privacy. Discuss both views and give your opinion."
    },
    {
        "category": "Arts, Culture, Media & Advertising",
        "title": "Preservation of Traditional Music and Folk Art",
        "type": "Causes & Solutions",
        "prompt": "Traditional indigenous music, folklore, and dance are being replaced by globalized American and western pop culture. Why is traditional folklore declining, and what measures can cultural bodies implement to keep local traditions vibrant?"
    },
    {
        "category": "Arts, Culture, Media & Advertising",
        "title": "Museum Entry Fees vs Free Public Admission",
        "type": "Discuss Both Views & Opinion",
        "prompt": "Some argue national museums and art galleries should charge entry fees to cover operational and maintenance costs. Others maintain public museums must be completely free of charge to promote education and culture. Discuss both views and give your opinion."
    },
    {
        "category": "Arts, Culture, Media & Advertising",
        "title": "Fake News and Social Media Information Literacy",
        "type": "Causes & Solutions",
        "prompt": "The rapid spread of unverified information and deliberate 'fake news' on digital networks undermines democratic elections and public health. What factors enable misinformation to spread so rapidly, and how can society cultivate critical media literacy?"
    },
    {
        "category": "Arts, Culture, Media & Advertising",
        "title": "Banning Advertising of Luxury Goods",
        "type": "Agree / Disagree",
        "prompt": "Advertising expensive luxury items like high-end watches, luxury cars, and designer clothing creates social envy and unrealistic expectations. Some propose banning luxury marketing. To what extent do you agree or disagree?"
    },
    {
        "category": "Arts, Culture, Media & Advertising",
        "title": "Reading Fiction Novels vs Practical Non-Fiction",
        "type": "Discuss Both Views & Opinion",
        "prompt": "Some people believe reading literary fiction is a waste of time and that people should read factual non-fiction books to gain real knowledge. Others believe reading stories develops empathy, imagination, and language eloquence. Discuss both views and give your opinion."
    },
    {
        "category": "Arts, Culture, Media & Advertising",
        "title": "Preserving Minority Languages from Extinction",
        "type": "To What Extent",
        "prompt": "Every month, several indigenous minority languages disappear forever. Some believe spending money to document and revive dying languages is pointless when a few global languages dominate. To what extent do you agree or disagree?"
    },
    {
        "category": "Arts, Culture, Media & Advertising",
        "title": "Digital Streaming Platforms and Traditional Cinema",
        "type": "Advantages vs Disadvantages",
        "prompt": "The proliferation of home streaming services (such as Netflix and Disney+) has led to declining attendance in public movie theaters. Do the advantages of home digital streaming outweigh the decline of community cinema culture?"
    },
    {
        "category": "Arts, Culture, Media & Advertising",
        "title": "Sponsorship of Arts by Private Corporations",
        "type": "Advantages vs Disadvantages",
        "prompt": "Many modern artists, theater productions, and art exhibitions rely on commercial sponsorship from banks and corporations rather than government funding. Do the advantages of private corporate arts sponsorship outweigh the disadvantages?"
    },
    {
        "category": "Arts, Culture, Media & Advertising",
        "title": "Children Imitating Influencer Lifestyles on Social Media",
        "type": "Problems & Solutions",
        "prompt": "Young adolescents increasingly aspire to become online influencers rather than pursuing traditional professions like medicine, engineering, or teaching. What societal problems could this mindset cause, and how should educational institutions respond?"
    },
    {
        "category": "Arts, Culture, Media & Advertising",
        "title": "Public Art and Graffiti: Vandalism or Creative Expression?",
        "type": "Discuss Both Views & Opinion",
        "prompt": "Some believe unauthorized street art and graffiti is criminal vandalism that degrades neighborhoods and should be strictly penalized. Others consider street murals a valuable form of democratic cultural expression. Discuss both views and give your opinion."
    },
    {
        "category": "Arts, Culture, Media & Advertising",
        "title": "International Sporting Competition as a Peace Promoter",
        "type": "To What Extent",
        "prompt": "International sporting tournaments like the Olympics foster goodwill and mutual understanding between rival nations. To what extent do you agree or disagree that international sport reduces geopolitical conflict?"
    },
    {
        "category": "Arts, Culture, Media & Advertising",
        "title": "Censoring Violent Lyrics and Explicit Music",
        "type": "Agree / Disagree",
        "prompt": "Songs that contain sexually explicit or violent lyrics should be banned from public radio stations and music streaming charts. To what extent do you agree or disagree?"
    },

    # =========================================================================
    # 10. CITIES, TRANSPORT, GLOBALIZATION & TOURISM (Topics 136 - 150)
    # =========================================================================
    {
        "category": "Cities, Transport & Globalization",
        "title": "Banning Private Cars from Central Metropolitan Areas",
        "type": "Agree / Disagree",
        "prompt": "To eradicate gridlock traffic and hazardous smog, municipal authorities should ban all private cars from driving within inner city centers, permitting only public buses, cycles, and pedestrians. To what extent do you agree or disagree?"
    },
    {
        "category": "Cities, Transport & Globalization",
        "title": "Overtourism and Damage to Historic Heritage Sites",
        "type": "Causes & Solutions",
        "prompt": "Popular tourist destinations like Venice, Kyoto, and Machu Picchu suffer from severe overcrowding, rising living costs for locals, and degradation of historical monuments. What causes overtourism, and what sustainable tourism policies should be enforced?"
    },
    {
        "category": "Cities, Transport & Globalization",
        "title": "High-Speed Rail Networks vs Domestic Air Travel",
        "type": "Advantages vs Disadvantages",
        "prompt": "Many countries are investing heavily in high-speed bullet train networks to replace short-haul domestic flights. Do the environmental and connectivity advantages of high-speed rail outweigh the immense engineering costs?"
    },
    {
        "category": "Cities, Transport & Globalization",
        "title": "Rural-to-Urban Migration and Mega-City Growth",
        "type": "Causes & Consequences",
        "prompt": "Millions of people in developing countries migrate from agrarian villages to congested mega-cities every year. What are the main drivers of rural-to-urban migration, and what consequences does this migration produce for both cities and rural communities?"
    },
    {
        "category": "Cities, Transport & Globalization",
        "title": "Living in Modern High-Rise Apartments vs Suburban Houses",
        "type": "Discuss Both Views & Opinion",
        "prompt": "Some believe living in high-rise city apartments is the most efficient, sustainable way to house urban populations. Others argue detached houses with private gardens in quiet suburban areas offer vastly superior quality of life. Discuss both views and give your opinion."
    },
    {
        "category": "Cities, Transport & Globalization",
        "title": "E-Scooters and Bicycle Lanes in Modern Cities",
        "type": "Advantages vs Disadvantages",
        "prompt": "Many cities are replacing car lanes with dedicated paths for bicycles and electric scooters to promote green micro-mobility. Do the advantages of e-scooters and cycling lanes outweigh the safety hazards and traffic disruption?"
    },
    {
        "category": "Cities, Transport & Globalization",
        "title": "Cultural Homogenization and Global Brand Dominance",
        "type": "Agree / Disagree",
        "prompt": "Due to globalization, city shopping centers around the world look virtually identical, filled with the same international retail and fast food brands. This destroys authentic cultural uniqueness. To what extent do you agree or disagree?"
    },
    {
        "category": "Cities, Transport & Globalization",
        "title": "Subsidizing Rural Relocation to Decongest Megacities",
        "type": "To What Extent",
        "prompt": "Governments should offer monetary subsidies and tax holidays to businesses and families willing to move out of overcrowded capitals into declining provincial towns. To what extent do you agree or disagree?"
    },
    {
        "category": "Cities, Transport & Globalization",
        "title": "Ecotourism and Remote Environmental Exploration",
        "type": "Advantages vs Disadvantages",
        "prompt": "Ecotourism promises to support conservation by allowing tourists to visit fragile rainforests, glaciers, and coral reefs. Do the economic and educational advantages of ecotourism outweigh the environmental damage caused by travel?"
    },
    {
        "category": "Cities, Transport & Globalization",
        "title": "Public Transport vs Expanding Highway Networks",
        "type": "Discuss Both Views & Opinion",
        "prompt": "When tackling highway congestion, some argue governments should expand multi-lane motorways to increase vehicle capacity. Others argue building wider roads induces more traffic, and funds must be spent solely on trains and subways. Discuss both views and give your opinion."
    },
    {
        "category": "Cities, Transport & Globalization",
        "title": "The 15-Minute City Urban Planning Model",
        "type": "Advantages vs Disadvantages",
        "prompt": "The '15-minute city' urban planning concept proposes that all essential daily amenities (groceries, schools, clinics, parks, work) should be accessible within a 15-minute walk or bike ride from every home. Do the advantages of this urban model outweigh its practical challenges?"
    },
    {
        "category": "Cities, Transport & Globalization",
        "title": "International Tourism and Cultural Misunderstandings",
        "type": "Discuss Both Views & Opinion",
        "prompt": "Some believe international tourism breaks down cultural prejudices and builds international harmony. Others argue mass tourism leads to shallow consumerism, commercialization of sacred customs, and resentment among locals. Discuss both views and give your opinion."
    },
    {
        "category": "Cities, Transport & Globalization",
        "title": "Gentrification of Historic Working-Class Neighborhoods",
        "type": "Advantages vs Disadvantages",
        "prompt": "In many cities, neglected working-class neighborhoods are renovated with upscale cafes and luxury developments ('gentrification'). Do the economic advantages of gentrification outweigh the displacement of long-term low-income residents?"
    },
    {
        "category": "Cities, Transport & Globalization",
        "title": "Space Tourism for Ultra-Wealthy Travelers",
        "type": "Agree / Disagree",
        "prompt": "Private aerospace firms now offer commercial sub-orbital spaceflights to wealthy tourists. Some argue space tourism causes immense carbon pollution for frivolous vanity and should be heavily taxed or prohibited. To what extent do you agree or disagree?"
    },
    {
        "category": "Cities, Transport & Globalization",
        "title": "Air Quality in Asian and Global Megacities",
        "type": "Causes & Solutions",
        "prompt": "Air pollution in many global megacities frequently exceeds safe World Health Organization limits, creating severe public health crises. What are the key drivers of urban toxic smog, and what structural initiatives can restore clean air to modern metropolises?"
    }
]


def generate_txt():
    txt_path = "IELTS_Writing_Task_2_150_Topics.txt"
    with open(txt_path, "w", encoding="utf-8") as f:
        f.write("================================================================================\n")
        f.write("                 IELTS WRITING TASK 2: 150 OFFICIAL-GRADE TOPICS                 \n")
        f.write("           Categorized, Formatted, and Calibrated for Band 7.0 - 9.0            \n")
        f.write("================================================================================\n\n")
        f.write("GENERAL TASK 2 ESSAY REQUIREMENTS:\n")
        f.write("- Recommended Timing: 40 Minutes\n")
        f.write("- Minimum Word Count: 250 Words (Optimal: 260 - 290 Words)\n")
        f.write("- Official Scoring Criteria: Task Achievement (25%), Coherence & Cohesion (25%),\n")
        f.write("                            Lexical Resource (25%), Grammatical Range & Accuracy (25%)\n\n")
        f.write("TABLE OF CONTENTS BY CATEGORY:\n")
        f.write("  1. Education & Higher Learning (Topics 1 - 15)\n")
        f.write("  2. Technology, AI & Digital Life (Topics 16 - 30)\n")
        f.write("  3. Environment, Climate & Energy (Topics 31 - 45)\n")
        f.write("  4. Health, Diet & Public Healthcare (Topics 46 - 60)\n")
        f.write("  5. Society, Family & Demographics (Topics 61 - 75)\n")
        f.write("  6. Work, Career & The Global Economy (Topics 76 - 90)\n")
        f.write("  7. Crime, Law & Justice (Topics 91 - 105)\n")
        f.write("  8. Government, Public Spending & Policy (Topics 106 - 120)\n")
        f.write("  9. Arts, Culture, Media & Advertising (Topics 121 - 135)\n")
        f.write("  10. Cities, Transport & Globalization (Topics 136 - 150)\n")
        f.write("================================================================================\n\n")

        current_cat = ""
        for i, t in enumerate(TOPICS, 1):
            if t["category"] != current_cat:
                current_cat = t["category"]
                f.write(f"\n{'#' * 80}\n")
                f.write(f"### SECTION: {current_cat.upper()}\n")
                f.write(f"{'#' * 80}\n\n")

            f.write(f"TOPIC #{i:03d}: {t['title']}\n")
            f.write(f"Category:     {t['category']}\n")
            f.write(f"Question Type: {t['type']}\n")
            f.write(f"Prompt:\n")
            f.write(f"  \"{t['prompt']}\"\n")
            f.write(f"Guidelines:   Write at least 250 words. Support your ideas with reasons and relevant examples.\n")
            f.write("-" * 80 + "\n\n")

    print(f"Generated TXT: {txt_path} ({os.path.getsize(txt_path)} bytes)")


class NumberedCanvas(canvas.Canvas):
    """Two-pass canvas to dynamically calculate total page count."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            super().showPage()
        super().save()

    def draw_page_number(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 750, "IELTS Writing Task 2 — 150 Comprehensive Practice Topics")
            self.setStrokeColor(colors.HexColor("#e2e8f0"))
            self.setLineWidth(0.5)
            self.line(54, 744, 558, 744)

        # Footer
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 36, page_str)
        self.drawString(54, 36, "Target: Band 7.0 - 9.0 • Minimum 250 Words • 40 Minutes")
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.5)
        self.line(54, 46, 558, 46)
        self.restoreState()


def generate_pdf():
    pdf_path = "IELTS_Writing_Task_2_150_Topics.pdf"
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()
    
    # Custom Typography Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=colors.HexColor('#0f172a'),
        alignment=1, # Center
        spaceAfter=6
    )

    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#475569'),
        alignment=1,
        spaceAfter=15
    )

    section_banner_style = ParagraphStyle(
        'SectionBanner',
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#ffffff'),
        spaceBefore=0,
        spaceAfter=0
    )

    topic_title_style = ParagraphStyle(
        'TopicTitle',
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=13,
        textColor=colors.HexColor('#0f172a'),
        spaceAfter=2
    )

    meta_style = ParagraphStyle(
        'MetaStyle',
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#2563eb'),
        spaceAfter=3
    )

    prompt_style = ParagraphStyle(
        'PromptStyle',
        fontName='Helvetica',
        fontSize=9,
        leading=12.5,
        textColor=colors.HexColor('#1e293b'),
        spaceAfter=4
    )

    elements = []

    # Title & Header
    elements.append(Paragraph("IELTS Writing Task 2", title_style))
    elements.append(Paragraph("150 Official-Grade Essay Topics Across 10 Core IELTS Domains", subtitle_style))
    
    # Overview Box Table
    summary_data = [
        [
            Paragraph("<b>Target Band:</b> 7.0 – 9.0", styles['Normal']),
            Paragraph("<b>Timing:</b> 40 Mins Recommended", styles['Normal']),
            Paragraph("<b>Word Count:</b> Min 250 Words", styles['Normal']),
            Paragraph("<b>Total Topics:</b> 150 Prompts", styles['Normal']),
        ]
    ]
    summary_table = Table(summary_data, colWidths=[126, 126, 126, 126])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 14))

    current_cat = ""
    for i, t in enumerate(TOPICS, 1):
        # Section Header Banner
        if t["category"] != current_cat:
            current_cat = t["category"]
            if i > 1:
                elements.append(Spacer(1, 10))

            banner_table = Table(
                [[Paragraph(f"<b>SECTION: {current_cat.upper()}</b>", section_banner_style)]],
                colWidths=[504]
            )
            banner_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#0f172a')),
                ('TOPPADDING', (0, 0), (-1, -1), 5),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
                ('LEFTPADDING', (0, 0), (-1, -1), 8),
                ('CORNERPAD', (0, 0), (-1, -1), 3),
            ]))
            elements.append(banner_table)
            elements.append(Spacer(1, 6))

        # Single Topic Block
        num_str = f"TOPIC #{i:03d} • {t['title']}"
        meta_str = f"QUESTION TYPE: {t['type'].upper()}  |  CATEGORY: {t['category']}"
        prompt_html = f"&ldquo;{t['prompt']}&rdquo;"

        topic_content = [
            Paragraph(num_str, topic_title_style),
            Paragraph(meta_str, meta_style),
            Paragraph(prompt_html, prompt_style),
        ]

        # Topic Box Table
        topic_table = Table(
            [[topic_content]],
            colWidths=[504]
        )
        bg_color = colors.HexColor('#fdfefe') if i % 2 == 0 else colors.HexColor('#f8fafc')
        topic_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), bg_color),
            ('BOX', (0, 0), (-1, -1), 0.75, colors.HexColor('#e2e8f0')),
            ('LINELEFT', (0, 0), (-1, -1), 3.5, colors.HexColor('#f59e0b')), # Amber accent bar
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ]))

        elements.append(KeepTogether([topic_table, Spacer(1, 5)]))

    doc.build(elements, canvasmaker=NumberedCanvas)
    print(f"Generated PDF: {pdf_path} ({os.path.getsize(pdf_path)} bytes)")


if __name__ == "__main__":
    generate_txt()
    generate_pdf()
