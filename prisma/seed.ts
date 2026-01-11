import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Topic definitions with space theme
const topics = [
  {
    slug: 'geometry',
    name: 'Geometry',
    description: 'Shapes, angles, area, and perimeter',
    icon: 'hexagon',
    color: '#3b82f6', // Planet blue
    orderIndex: 1,
  },
  {
    slug: 'fractions',
    name: 'Fractions',
    description: 'Parts of a whole, operations with fractions',
    icon: 'pie-chart',
    color: '#22c55e', // Planet green
    orderIndex: 2,
  },
  {
    slug: 'number-patterns',
    name: 'Number Patterns',
    description: 'Sequences, patterns, and relationships',
    icon: 'grid-3x3',
    color: '#f97316', // Planet orange
    orderIndex: 3,
  },
  {
    slug: 'whole-numbers',
    name: 'Whole Numbers',
    description: 'Operations, factors, multiples, and divisibility',
    icon: 'hash',
    color: '#a855f7', // Planet purple
    orderIndex: 4,
  },
  {
    slug: 'decimals',
    name: 'Decimals',
    description: 'Decimal operations and conversions',
    icon: 'percent',
    color: '#ec4899', // Planet pink
    orderIndex: 5,
  },
  {
    slug: 'word-problems',
    name: 'Word Problems',
    description: 'Multi-step problem solving with Singapore heuristics',
    icon: 'book-open',
    color: '#eab308', // Planet yellow
    orderIndex: 6,
  },
];

// Sample questions for each topic and tier
const sampleQuestions = [
  // GEOMETRY
  // Tier 1 - Iron (Fluency)
  {
    topicSlug: 'geometry',
    slug: 'geo-t1-rectangle-area-001',
    tier: 1,
    title: 'Rectangle Area',
    content: 'Find the area of a rectangle with length 8 cm and width 5 cm.',
    answer: '40',
    answerType: 'numeric',
    hints: JSON.stringify(['Area = length × width', 'Multiply 8 by 5']),
    solution: 'Area = length × width = 8 × 5 = 40 cm²',
    xpValue: 10,
  },
  {
    topicSlug: 'geometry',
    slug: 'geo-t1-square-perimeter-001',
    tier: 1,
    title: 'Square Perimeter',
    content: 'A square has sides of 7 cm. What is its perimeter?',
    answer: '28',
    answerType: 'numeric',
    hints: JSON.stringify(['Perimeter = 4 × side', 'Multiply 4 by 7']),
    solution: 'Perimeter = 4 × side = 4 × 7 = 28 cm',
    xpValue: 10,
  },
  // Tier 2 - Bronze (Application)
  {
    topicSlug: 'geometry',
    slug: 'geo-t2-composite-area-001',
    tier: 2,
    title: 'L-Shape Area',
    content: 'An L-shaped figure is made of two rectangles. The first rectangle is 6 cm by 4 cm. The second rectangle is 3 cm by 2 cm. Find the total area.',
    answer: '30',
    answerType: 'numeric',
    hints: JSON.stringify([
      'Find the area of each rectangle separately',
      'First rectangle: 6 × 4 = 24 cm²',
      'Add the two areas together',
    ]),
    solution: 'Area of first rectangle = 6 × 4 = 24 cm²\nArea of second rectangle = 3 × 2 = 6 cm²\nTotal area = 24 + 6 = 30 cm²',
    xpValue: 15,
  },
  // Tier 3 - Silver (Heuristic)
  {
    topicSlug: 'geometry',
    slug: 'geo-t3-corner-cut-001',
    tier: 3,
    title: 'Corner Cut Rectangle',
    content: 'A rectangle measures 12 cm by 10 cm. A square of side 3 cm is cut from each corner. Find the area of the remaining figure.',
    answer: '84',
    answerType: 'numeric',
    heuristic: 'subtraction',
    hints: JSON.stringify([
      'Draw the original rectangle first',
      'How many corners are cut? What is the total area removed?',
      'Each corner is a 3×3 = 9 cm² square',
    ]),
    solution: 'Original rectangle area = 12 × 10 = 120 cm²\nEach corner square = 3 × 3 = 9 cm²\n4 corners removed = 4 × 9 = 36 cm²\nRemaining area = 120 - 36 = 84 cm²',
    source: 'sasmo',
    xpValue: 25,
    isChallengeQuestion: true,
  },

  // FRACTIONS
  // Tier 1 - Iron
  {
    topicSlug: 'fractions',
    slug: 'frac-t1-add-same-denom-001',
    tier: 1,
    title: 'Add Same Denominators',
    content: 'Calculate: $\\frac{3}{8} + \\frac{2}{8}$',
    answer: '5/8',
    acceptedAnswers: JSON.stringify(['5/8', '0.625']),
    answerType: 'exact',
    hints: JSON.stringify(['When denominators are the same, just add the numerators', '3 + 2 = ?']),
    solution: '$\\frac{3}{8} + \\frac{2}{8} = \\frac{3+2}{8} = \\frac{5}{8}$',
    xpValue: 10,
  },
  // Tier 2 - Bronze
  {
    topicSlug: 'fractions',
    slug: 'frac-t2-word-problem-001',
    tier: 2,
    title: 'Pizza Fractions',
    content: 'Mary ate $\\frac{1}{4}$ of a pizza. John ate $\\frac{2}{4}$ of the same pizza. What fraction of the pizza is left?',
    answer: '1/4',
    acceptedAnswers: JSON.stringify(['1/4', '0.25']),
    answerType: 'exact',
    hints: JSON.stringify([
      'First find how much was eaten in total',
      'Mary + John = 1/4 + 2/4 = 3/4',
      'Subtract from 1 whole pizza',
    ]),
    solution: 'Total eaten = $\\frac{1}{4} + \\frac{2}{4} = \\frac{3}{4}$\nLeft = $1 - \\frac{3}{4} = \\frac{1}{4}$',
    xpValue: 15,
  },
  // Tier 3 - Silver
  {
    topicSlug: 'fractions',
    slug: 'frac-t3-model-method-001',
    tier: 3,
    title: 'Marbles Model Method',
    content: 'After giving away $\\frac{2}{5}$ of his marbles, Ali had 36 marbles left. How many marbles did he have at first?',
    answer: '60',
    answerType: 'numeric',
    heuristic: 'model-method',
    hints: JSON.stringify([
      'Draw a bar model with 5 equal parts',
      'He gave away 2 parts, so 3 parts = 36 marbles',
      'Find the value of 1 part first',
    ]),
    solution: 'Let the total be 5 units.\nGave away 2 units, left with 3 units.\n3 units = 36 marbles\n1 unit = 36 ÷ 3 = 12 marbles\n5 units = 12 × 5 = 60 marbles',
    source: 'school',
    xpValue: 25,
    isChallengeQuestion: true,
  },

  // NUMBER PATTERNS
  // Tier 1
  {
    topicSlug: 'number-patterns',
    slug: 'pattern-t1-simple-001',
    tier: 1,
    title: 'Find the Pattern',
    content: 'What is the next number in the sequence: 2, 4, 6, 8, __?',
    answer: '10',
    answerType: 'numeric',
    hints: JSON.stringify(['Look at the difference between consecutive numbers', 'Each number increases by 2']),
    solution: 'The pattern is adding 2 each time.\n8 + 2 = 10',
    xpValue: 10,
  },
  // Tier 2
  {
    topicSlug: 'number-patterns',
    slug: 'pattern-t2-multiplication-001',
    tier: 2,
    title: 'Growing Pattern',
    content: 'Find the 5th term in the sequence: 3, 6, 12, 24, __',
    answer: '48',
    answerType: 'numeric',
    hints: JSON.stringify([
      'How do you get from one term to the next?',
      'Each term is multiplied by 2',
    ]),
    solution: 'Each term is doubled (×2).\n24 × 2 = 48',
    xpValue: 15,
  },
  // Tier 3
  {
    topicSlug: 'number-patterns',
    slug: 'pattern-t3-difference-001',
    tier: 3,
    title: 'Second Differences',
    content: 'Find the 6th term in the sequence: 2, 5, 10, 17, 26, __',
    answer: '37',
    answerType: 'numeric',
    heuristic: 'pattern-recognition',
    hints: JSON.stringify([
      'Find the differences between consecutive terms: 3, 5, 7, 9',
      'The differences form a pattern too!',
      'The next difference should be 11',
    ]),
    solution: 'Differences: 3, 5, 7, 9, ... (increases by 2 each time)\nNext difference = 11\n6th term = 26 + 11 = 37',
    source: 'nmos',
    xpValue: 25,
    isChallengeQuestion: true,
  },

  // WHOLE NUMBERS
  // Tier 1
  {
    topicSlug: 'whole-numbers',
    slug: 'whole-t1-factors-001',
    tier: 1,
    title: 'Find Factors',
    content: 'List all the factors of 12.',
    answer: '1,2,3,4,6,12',
    acceptedAnswers: JSON.stringify(['1, 2, 3, 4, 6, 12', '1,2,3,4,6,12']),
    answerType: 'exact',
    hints: JSON.stringify([
      'Factors are numbers that divide evenly into 12',
      'Start from 1 and work your way up',
    ]),
    solution: 'Factors of 12: 1, 2, 3, 4, 6, 12',
    xpValue: 10,
  },
  // Tier 2
  {
    topicSlug: 'whole-numbers',
    slug: 'whole-t2-lcm-001',
    tier: 2,
    title: 'LCM Problem',
    content: 'Find the lowest common multiple (LCM) of 6 and 8.',
    answer: '24',
    answerType: 'numeric',
    hints: JSON.stringify([
      'List multiples of 6: 6, 12, 18, 24, 30...',
      'List multiples of 8: 8, 16, 24, 32...',
      'Find the smallest number in both lists',
    ]),
    solution: 'Multiples of 6: 6, 12, 18, 24...\nMultiples of 8: 8, 16, 24...\nLCM = 24',
    xpValue: 15,
  },

  // DECIMALS
  // Tier 1
  {
    topicSlug: 'decimals',
    slug: 'dec-t1-add-001',
    tier: 1,
    title: 'Add Decimals',
    content: 'Calculate: 3.5 + 2.75',
    answer: '6.25',
    answerType: 'numeric',
    hints: JSON.stringify([
      'Line up the decimal points',
      'Add column by column from right to left',
    ]),
    solution: '  3.50\n+ 2.75\n------\n  6.25',
    xpValue: 10,
  },
  // Tier 2
  {
    topicSlug: 'decimals',
    slug: 'dec-t2-multiply-001',
    tier: 2,
    title: 'Multiply Decimals',
    content: 'Calculate: 0.4 × 0.3',
    answer: '0.12',
    answerType: 'numeric',
    hints: JSON.stringify([
      'Multiply as if there are no decimal points: 4 × 3 = 12',
      'Count total decimal places in both numbers (1 + 1 = 2)',
      'Place the decimal point 2 places from the right',
    ]),
    solution: '0.4 × 0.3 = 0.12\n(4 × 3 = 12, then place decimal 2 places from right)',
    xpValue: 15,
  },

  // WORD PROBLEMS
  // Tier 1
  {
    topicSlug: 'word-problems',
    slug: 'word-t1-simple-001',
    tier: 1,
    title: 'Simple Word Problem',
    content: 'Tom has 15 apples. He gives 7 apples to his friend. How many apples does Tom have now?',
    answer: '8',
    answerType: 'numeric',
    hints: JSON.stringify(['This is a subtraction problem', '15 - 7 = ?']),
    solution: 'Tom has 15 - 7 = 8 apples left.',
    xpValue: 10,
  },
  // Tier 2
  {
    topicSlug: 'word-problems',
    slug: 'word-t2-two-step-001',
    tier: 2,
    title: 'Two-Step Problem',
    content: 'A shop sold 48 oranges in the morning and 35 oranges in the afternoon. If each orange costs $0.50, how much money did the shop collect in total?',
    answer: '41.50',
    acceptedAnswers: JSON.stringify(['41.50', '41.5', '$41.50']),
    answerType: 'numeric',
    hints: JSON.stringify([
      'First find the total number of oranges sold',
      '48 + 35 = 83 oranges',
      'Then multiply by the price',
    ]),
    solution: 'Total oranges = 48 + 35 = 83\nTotal money = 83 × $0.50 = $41.50',
    xpValue: 15,
  },
  // Tier 3
  {
    topicSlug: 'word-problems',
    slug: 'word-t3-gap-diff-001',
    tier: 3,
    title: 'Gap and Difference',
    content: 'Amy has 3 times as many stickers as Ben. If Amy gives Ben 20 stickers, they will have the same number. How many stickers does Amy have?',
    answer: '60',
    answerType: 'numeric',
    heuristic: 'gap-difference',
    hints: JSON.stringify([
      'Draw a model: Amy has 3 units, Ben has 1 unit',
      'For them to be equal, Amy needs to give away half the difference',
      'The difference is 2 units = 40 stickers (since she gives 20 each way)',
    ]),
    solution: 'Let Ben have 1 unit. Amy has 3 units.\nDifference = 2 units\nFor equal: Amy gives 1 unit to Ben\n1 unit = 20 stickers\nAmy has 3 units = 60 stickers',
    source: 'school',
    xpValue: 25,
    isChallengeQuestion: true,
  },
];

async function main() {
  console.log('🌟 Starting seed...\n');

  // Clear existing data
  console.log('🧹 Clearing existing data...');
  await prisma.tierChallengeQuestion.deleteMany();
  await prisma.tierChallenge.deleteMany();
  await prisma.questionAttempt.deleteMany();
  await prisma.topicProgress.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.question.deleteMany();
  await prisma.topic.deleteMany();
  await prisma.student.deleteMany();
  await prisma.importedPDF.deleteMany();

  // Create topics
  console.log('🪐 Creating topics...');
  const createdTopics: Record<string, string> = {};

  for (const topic of topics) {
    const created = await prisma.topic.create({
      data: topic,
    });
    createdTopics[topic.slug] = created.id;
    console.log(`  ✓ ${topic.name}`);
  }

  // Create questions
  console.log('\n📝 Creating sample questions...');
  for (const question of sampleQuestions) {
    const { topicSlug, ...questionData } = question;
    await prisma.question.create({
      data: {
        ...questionData,
        topicId: createdTopics[topicSlug],
      },
    });
    console.log(`  ✓ [T${question.tier}] ${question.title}`);
  }

  // Create a default student profile
  console.log('\n👨‍🚀 Creating default student profile...');
  const student = await prisma.student.create({
    data: {
      name: 'Space Explorer',
      avatar: 'rocket',
      color: '#7c3aed',
      isActive: true,
    },
  });
  console.log(`  ✓ ${student.name}`);

  // Initialize topic progress for the student
  console.log('\n📊 Initializing topic progress...');
  for (const [slug, topicId] of Object.entries(createdTopics)) {
    await prisma.topicProgress.create({
      data: {
        studentId: student.id,
        topicId,
        currentTier: 1,
        tierXp: 0,
        tierXpRequired: 100,
      },
    });
    console.log(`  ✓ ${slug} progress initialized`);
  }

  // Award a welcome badge
  console.log('\n🏆 Awarding welcome badge...');
  await prisma.badge.create({
    data: {
      studentId: student.id,
      type: 'welcome',
      name: 'Space Cadet',
      description: 'Welcome to SG Math Pal! Your journey begins.',
      icon: 'rocket',
    },
  });
  console.log('  ✓ Space Cadet badge awarded');

  console.log('\n✨ Seed completed successfully!\n');

  // Summary
  const topicCount = await prisma.topic.count();
  const questionCount = await prisma.question.count();
  const studentCount = await prisma.student.count();

  console.log('📈 Summary:');
  console.log(`  • ${topicCount} topics`);
  console.log(`  • ${questionCount} questions`);
  console.log(`  • ${studentCount} student(s)`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
