// AUTO-GENERATED from "Our role sizing scheme v2.docx" and "JE Scheme Database 2022.xlsx".
// Every level's points value is cross-validated against the workbook's Points sheet.
// Regenerate with scripts/generate-scheme.py rather than editing by hand.

export type CornerstoneKey = 'knowHow' | 'people' | 'thinking' | 'delivery'

export interface SchemeLevel {
  /** Level number as it appears in the scheme (1-based). */
  level: number
  /** Short headline for the level, from the Factor Breakdown sheet. */
  label: string
  /** Full scheme criteria, from the role sizing scheme document. */
  description: string
  /** The "what does this mean?" expansion from the Factor Breakdown sheet. */
  meaning: string
  points: number
}

export interface SchemeFactor {
  id: string
  /** Factor number 1-11, as numbered in the scheme document. */
  number: number
  name: string
  /** Column heading used in the JE Scheme Database workbook. */
  shortName: string
  cornerstone: CornerstoneKey
  levels: SchemeLevel[]
}

export interface Cornerstone {
  key: CornerstoneKey
  number: number
  name: string
  intro: string
}

export const CORNERSTONES: Cornerstone[] = [
  {
    key: 'knowHow',
    number: 1,
    name: "Know How",
    intro:
      "Know-how underpins everything you do, from an understanding of how your role fits into the service that we deliver to our customers to a deep understanding of the commercial, financial and operational environment of our business. Our professional expertise enables us to understand and serve the needs of both customers and colleagues.",
  },
  {
    key: 'people',
    number: 2,
    name: "People",
    intro:
      "People are at the heart of everything we do at, from delivering high-quality services direct to our customers, to collaborating with colleagues to build a stronger organisation. This cornerstone looks at how we use a range of skills to work with people around us. This includes how we work with and through others to get things done; how we communicate with others; and how we build relationships.",
  },
  {
    key: 'thinking',
    number: 3,
    name: "Thinking",
    intro:
      "Thinking about the best way to deliver and improve services to our customers supports everything that we do, from solving a problem for a customer to thinking about how to transform the organisation. This cornerstone looks at all the ways in which we need to think about issues, from analysing issues and diagnosing problems, to developing solutions, all the way through to changing and innovating in the way we work.",
  },
  {
    key: 'delivery',
    number: 4,
    name: "Delivery",
    intro:
      "Delivering a great service to our customers, building communities and changing lives is what we are all here to do. This cornerstone looks at the ingredients that are needed to deliver the right results to our diverse range of customers, from owning work to making decisions, taking account of the context in which each role operates.",
  },
]

export const FACTORS: SchemeFactor[] = [
  {
    id: 'professional-expertise',
    number: 1,
    name: "Professional Expertise",
    shortName: "Professional Expertise",
    cornerstone: 'knowHow',
    levels: [
      {
        level: 1,
        label: "A small amount of practical skill",
        description:
          "Role holder needs basic knowledge, with a small number of straightforward tasks that can be learnt on the job. Practical and low levels of skill.",
        meaning:
          "Tasks can generally be learnt on the job",
        points: 45,
      },
      {
        level: 2,
        label: "An understanding of straight-forward processes",
        description:
          "A general education (numeracy and literacy) and an understanding of straight-forward procedures and processes needed.",
        meaning:
          "Numeracy and literacy needed to learn a range of procedures",
        points: 90,
      },
      {
        level: 3,
        label: "A practical level of skill",
        description:
          "General education (numeracy and literacy), plus good knowledge of operational or functional processes",
        meaning:
          "A sound knowledge of procedures and processes in an area of work",
        points: 135,
      },
      {
        level: 4,
        label: "Skilled practical knowledge",
        description:
          "Skilled practical or vocational knowledge, typically gained through a mixture of study and on-the-job training.",
        meaning:
          "Technical or vocational knowledge of an area of skilled work",
        points: 180,
      },
      {
        level: 5,
        label: "Professional knowledge",
        description:
          "Needs professional knowledge of a discipline, typically gained through formal studying, equivalent to degree level.",
        meaning:
          "A formal understanding of the concepts that underpin an area of work and the ability to apply this in practice",
        points: 225,
      },
      {
        level: 6,
        label: "Professional knowledge AND substantial experience",
        description:
          "Needs professional knowledge as at Level 5, but this has been built on through substantial experience of using the knowledge in practice",
        meaning:
          "A formal understanding of the concepts, that have been built on through substantial experience of using the knowledge in practice",
        points: 270,
      },
      {
        level: 7,
        label: "Deep technical and professional expertise",
        description:
          "Deep technical expertise: In-depth, advanced, technical knowledge that has been built on through substantial experience of using the knowledge across a range of different settings",
        meaning:
          "In-depth, advanced, technical knowledge that has been built on through substantial experience of using the knowledge across a range of different settings",
        points: 315,
      },
      {
        level: 8,
        label: "Lead technical expertise",
        description:
          "Lead technical expertise: Highly advanced technical knowledge and experience sufficient to be the lead technical expert for a business area",
        meaning:
          "Highly advanced technical knowledge and experience sufficient to be the lead technical expert for a business area",
        points: 360,
      },
    ],
  },
  {
    id: 'commercial-and-operational-know-how',
    number: 2,
    name: "Commercial and Operational Know How",
    shortName: "Commercial & Operational Know-How",
    cornerstone: 'knowHow',
    levels: [
      {
        level: 1,
        label: "Understanding the immediate work area",
        description:
          "Role holder needs to understand the work of the immediate team and no wider knowledge.",
        meaning:
          "Needs an understanding of the work of the immediate team",
        points: 45,
      },
      {
        level: 2,
        label: "Understanding the whole function",
        description:
          "Role holder needs to understand the work of the function, which may be broader than the specific team (e.g. across HR as a whole)",
        meaning:
          "Needs an understanding of work of the function, as well as the immediate team",
        points: 90,
      },
      {
        level: 3,
        label: "Understanding both the internal and external context",
        description:
          "Needs an understanding of both the internal and external operating environment and how this impacts on their work",
        meaning:
          "Needs an understanding of both the internal and external operating environment and how this impacts on their work",
        points: 135,
      },
      {
        level: 4,
        label: "Understanding the financial and commercial context",
        description:
          "Needs an understanding of the commercial, operational and financial context to their role, and the skills to apply this in their work",
        meaning:
          "Needs an understanding of the commercial, operational and financial context to their role, and the skills to apply this in their work",
        points: 180,
      },
      {
        level: 5,
        label: "Linking the financial and commercial context to managing and improving service delivery",
        description:
          "Needs a strong knowledge of the commercial, operational and financial context to the function, and the skills to apply this to managing and improving operational delivery.",
        meaning:
          "Needs a strong knowledge of the commercial, operational and financial context to the function, and the skills to apply this to managing and improving operational delivery",
        points: 225,
      },
      {
        level: 6,
        label: "Linking the wider operating model to managing and developing services",
        description:
          "Needs a deep understanding of the organisational, financial, commercial and political context both to their function and the organisation as a whole, and the skills to manage and develop operating models in an ambiguous and changing environment.",
        meaning:
          "Needs a deep understanding of the organisational, financial, commercial and political context both to their function and the organisation as a whole, and the skills to manage and develop operating models in an ambiguous and changing environment.",
        points: 270,
      },
      {
        level: 7,
        label: "Linking the organisational context to developing strategy",
        description:
          "Needs significant commercial, organisational, financial and political awareness and understanding across the whole organisation and set within the context of the current and future external operating environment, as well as the skills to operate in an ambiguous and changing environment.",
        meaning:
          "Needs significant commercial, organisational, financial and political awareness and understanding across the whole organisation and set within the context of the current and future external operating environment, as well as the skills to operate in an ambiguous and changing environment.",
        points: 315,
      },
    ],
  },
  {
    id: 'working-with-and-through-people-to-deliver',
    number: 3,
    name: "Working With and Through People to Deliver",
    shortName: "Working Through People",
    cornerstone: 'people',
    levels: [
      {
        level: 1,
        label: "Working effectively with the team to deliver",
        description:
          "Works effectively with fellow team members, helping them when problems arise",
        meaning:
          "Works effectively with fellow team members, helping them when problems arise",
        points: 10,
      },
      {
        level: 2,
        label: "Supporting other team members to deliver",
        description:
          "Works effectively with a range of colleagues, supporting and advising less experienced colleagues with more difficult or unusual issues",
        meaning:
          "Works effectively with a range of colleagues, supporting and advising less experienced colleagues with more difficult or unusual issues",
        points: 20,
      },
      {
        level: 3,
        label: "Coaching or supervising others to deliver",
        description:
          "Works effectively with a range of colleagues, using coaching or supervisory skills to support and develop less experienced colleagues",
        meaning:
          "Works effectively with a range of colleagues, using coaching or supervisory skills to support and develop less experienced colleagues",
        points: 30,
      },
      {
        level: 4,
        label: "Leads others to deliver",
        description:
          "Leads a team, or builds project teams with colleagues across the business, motivating and inspiring others to deliver an excellent service to customers and colleagues",
        meaning:
          "Leads a team, or builds project teams with colleagues across the business, motivating and inspiring others to deliver an excellent service to customers and colleagues",
        points: 40,
      },
      {
        level: 5,
        label: "Leads within a business area to deliver",
        description:
          "Is a leader in a business area, able to work through more than one layer and cross-functionally to inspire others and deliver an excellent service to customers and colleagues",
        meaning:
          "Is a leader in a business area, able to work through more than one layer and cross-functionally to inspire others and deliver an excellent service to customers and colleagues",
        points: 50,
      },
      {
        level: 6,
        label: "Builds a business area to deliver",
        description:
          "Builds business functions that deliver success, as a leader of a complex function, able to work through others to inspire colleagues at all levels to deliver an excellent service",
        meaning:
          "Builds business functions that deliver success, as a leader of a complex function, able to work through others to inspire colleagues at all levels to deliver an excellent service",
        points: 60,
      },
    ],
  },
  {
    id: 'communicating',
    number: 4,
    name: "Communicating",
    shortName: "Communicating",
    cornerstone: 'people',
    levels: [
      {
        level: 1,
        label: "Exchanging straight-forward information",
        description:
          "Exchanges straight-forward information with fellow team members and some customers.",
        meaning:
          "Speaks clearly and listens to the answer. Exchanges straight-forward information with fellow team members and some customers.",
        points: 10,
      },
      {
        level: 2,
        label: "Exchanging information with a range of customers and colleagues",
        description:
          "Explains information in an uncomplicated way, and writes short reports and emails in clear and succinct language. Listens carefully to customers and colleagues’ issues, where some of them might be difficult.",
        meaning:
          "Explains information in an uncomplicated way, and writes short reports and emails in clear and succinct language. Listens carefully to customers and colleagues’ issues, where some of them might be difficult.",
        points: 20,
      },
      {
        level: 3,
        label: "Listening and giving advice",
        description:
          "Expresses, opinions, information and key points of an argument clearly, both in verbally and in writing. Listens and interprets customer and colleagues needs, and able to hold discussions (some of which may be difficult) that require interpretation, judgement and advice.",
        meaning:
          "Expresses, opinions, information and key points of an argument clearly, both in verbally and in writing. Listens and interprets customer and colleagues needs, and able to hold discussions (some of which may be difficult) that require interpretation, judgement and advice.",
        points: 30,
      },
      {
        level: 4,
        label: "Communicating difficult, complex and contentious issues",
        description:
          "Able to hold effective discussions with customers and colleagues on subjects that might be complex and contentious. Uses a range of communication styles, and structures both written and verbal information to meet the needs and understanding of the intended audience.",
        meaning:
          "Able to hold effective discussions with customers and colleagues on subjects that might be complex and contentious. Uses a range of communication styles, and structures both written and verbal information to meet the needs and understanding of the intended audience.",
        points: 40,
      },
      {
        level: 5,
        label: "Communicating at the level of a service",
        description:
          "Communicates on behalf of a service or business area. Uses a range of communication styles and approaches to effectively communicate information that is frequently complex and contentious information with a range of different audiences (from individual customers and colleagues to large groups and organisations) on issues that have an impact at the level of a service or function.",
        meaning:
          "Uses a range of communication styles and approaches to effectively communicate information that is frequently complex and contentious information with a range of different audiences (from individual customers and colleagues to large groups and organisations) on issues that have an impact at the level of a service or function.",
        points: 50,
      },
      {
        level: 6,
        label: "Communicating on behalf of the organisation",
        description:
          "Communicates effectively on behalf of the organisation in situations that are ambiguous and high risk, with a range of competing demands, at a senior level.",
        meaning:
          "Communicates effectively on behalf of the organisation in situations that are ambiguous and high risk, with a range of competing demands, at a senior level.",
        points: 60,
      },
    ],
  },
  {
    id: 'building-relationships',
    number: 5,
    name: "Building Relationships",
    shortName: "Building Relationships",
    cornerstone: 'people',
    levels: [
      {
        level: 1,
        label: "Builds straight-forward relationships",
        description:
          "Establishes good relationships with customers and colleagues in their area of the business. Relationships typically with direct colleagues or transactional relationships with customers.",
        meaning:
          "Establishes good relationships with customers and colleagues in their area of the business.",
        points: 10,
      },
      {
        level: 2,
        label: "Builds working relationships",
        description:
          "Builds relationships may be ongoing in nature and go beyond the transactional to involve discussion and agreement.",
        meaning:
          "Builds and maintains strong working relationships with a regular range of customers and colleagues, using active listening skills and showing empathy to others. Gains agreement between self and colleagues and able to manage expectations of others.",
        points: 20,
      },
      {
        level: 3,
        label: "Builds lasting relationships",
        description:
          "Builds longer-term working relationships with a wide range of colleagues and customers, considering things from other people’s perspectives. Uses different approaches to interact successfully with others, considering how others perceptions might influence the way they behave.",
        meaning:
          "Builds longer-term working relationships with wide range of colleagues and customers, considering things from other people’s perspectives. Uses different approaches to interact successfully with others, considering how others perceptions might influence the way they behave.",
        points: 30,
      },
      {
        level: 4,
        label: "Builds partnerships",
        description:
          "Establishes long-term partnerships both with current and potential stakeholders. Identifies and adopts the most appropriate interpersonal style for different circumstances. Gains clear agreement and commitment from others by persuading, convincing and negotiating.",
        meaning:
          "Establishes long-term partnerships both with current and potential stakeholders. Identifies and adopts the most appropriate interpersonal style for different circumstances. Gains clear agreement and commitment from others by persuading, convincing and negotiating",
        points: 40,
      },
      {
        level: 5,
        label: "Builds networks and manages conflict",
        description:
          "Builds networks, and negotiates well with those inside or outside the organisation, using a variety of approaches. Helps others to deal with challenging circumstances and manages conflict effectively. Uses a range of persuading and influencing skills to guide the conversation to a desired end point.",
        meaning:
          "Builds networks, and negotiates well with those inside or outside the organisation, using a variety of approaches. Helps others to deal with challenging circumstances and manages conflict effectively. Uses a range of persuading and influencing skills to guide the conversation to a desired end point.",
        points: 50,
      },
      {
        level: 6,
        label: "Builds complex relationships for the organisation",
        description:
          "Builds and manages high value and complex relationships at senior levels on behalf of the organisation, using a highly developed range of interpersonal skills to manage conflict and negotiate a successful conclusion for all parties.",
        meaning:
          "Builds and manages high value and complex relationships at senior levels on behalf of the organisation, using a highly developed range of interpersonal skills to manage conflict and negotiate a successful conclusion for all parties.",
        points: 60,
      },
      {
        level: 7,
        label: "Builds high-risk relationships for the organisation",
        description:
          "Builds and manages high-level relationships in political and/or high-risk situations, building support inside and, if necessary, outside the organisation for their initiatives. Changes the way people feel about a subject, not just the way they think.",
        meaning:
          "Builds and manages high-level relationships in political and/or high-risk situations, building support inside and, if necessary, outside the organisation for their initiatives. Changes the way people feel about a subject, not just the way they think.",
        points: 70,
      },
    ],
  },
  {
    id: 'analysis-and-insight',
    number: 6,
    name: "Analysis & Insight",
    shortName: "Analysis & Insight",
    cornerstone: 'thinking',
    levels: [
      {
        level: 1,
        label: "Straight-forward facts",
        description:
          "Understands and may collate straightforward facts.",
        meaning:
          "Understands straightforward facts",
        points: 10,
      },
      {
        level: 2,
        label: "Pulls together information",
        description:
          "Pulls together information or data from a range of different sources",
        meaning:
          "Pulls together information or data from a range of different sources",
        points: 20,
      },
      {
        level: 3,
        label: "Analyses and evaluates",
        description:
          "Analyses and evaluates information, testing assumptions and investigating different options within existing processes",
        meaning:
          "Analyses and evaluates information, testing assumptions and investigating different options within existing processes",
        points: 30,
      },
      {
        level: 4,
        label: "Diagnoses problems",
        description:
          "Uses analytical skills to diagnose problems, some of which might be complex",
        meaning:
          "Uses analytical skills to diagnose problems, some of which might be complex",
        points: 40,
      },
      {
        level: 5,
        label: "Analyses complex data as part of bigger picture",
        description:
          "Analyses complex data from a range of different sources, with an understanding of how one issue might be part of a much larger system or process",
        meaning:
          "Analyses complex data from a range of different sources, with an understanding of how one issue might be part of a much larger system or process",
        points: 50,
      },
      {
        level: 6,
        label: "High-level systems thinking",
        description:
          "Thinks broadly, undertaking high level analysis on complex data from a range of sources, some of which might be ambiguous or have competing information, with a strong understanding of complex inter-relationships within an overall system of processes.",
        meaning:
          "Thinks broadly, undertaking high level analysis on complex data from a range of sources, some of which might be ambiguous or have competing information, with a strong understanding of complex inter-relationships within an overall system of processes.",
        points: 60,
      },
    ],
  },
  {
    id: 'developing-solutions',
    number: 7,
    name: "Developing Solutions",
    shortName: "Developing Solutions",
    cornerstone: 'thinking',
    levels: [
      {
        level: 1,
        label: "Finds straight-forward solution",
        description:
          "Identifies the correct solution from a small number of options",
        meaning:
          "Identifies the correct solution from a small number of options",
        points: 10,
      },
      {
        level: 2,
        label: "Solves problems for customers and colleagues",
        description:
          "Uses problem solving skills to create solutions for customers and/or colleagues, considering the practical issues related to implementing different solutions",
        meaning:
          "Uses problem solving skills to create solutions for customers and/or colleagues, considering the practical issues related to implementing different solutions",
        points: 20,
      },
      {
        level: 3,
        label: "Develops new solutions for customers",
        description:
          "Produces workable solutions for customers or colleagues, developing new solutions to problems that have not occurred before",
        meaning:
          "Produces workable solutions for customers or colleagues, developing new solutions to problems that have not occurred before",
        points: 30,
      },
      {
        level: 4,
        label: "Develops complex solutions for customers",
        description:
          "Produces solutions to complex customer and/or colleague issues, thinking beyond the immediate issue to take the wider context and longer-term implications of the solution into account",
        meaning:
          "Produces solutions to complex customer and/or colleague issues, thinking beyond the immediate issue to take the wider context and longer-term implications of the solution into account",
        points: 40,
      },
      {
        level: 5,
        label: "Develops operational solutions for a service",
        description:
          "Develops operational solutions for a service/business area, understanding the short and long term financial, people, customer and business impact of competing options, and presents solutions for sign off at a senior level",
        meaning:
          "Develops operational solutions for a service/business area, understanding the short and long term financial, people, customer and business impact of competing options, and presents solutions for sign off at a senior level",
        points: 50,
      },
      {
        level: 6,
        label: "Develops strategic solutions",
        description:
          "Creates long-term strategic solutions that have an impact across the whole organisation, scanning the horizon to identify issues and solutions for long-term potential opportunities and risks.",
        meaning:
          "Creates long-term strategic solutions that have an impact across the whole organisation, scanning the horizon to identify issues and solutions for long-term potential opportunities and risks",
        points: 60,
      },
    ],
  },
  {
    id: 'change-and-innovation',
    number: 8,
    name: "Change & Innovation",
    shortName: "Change & Innovation",
    cornerstone: 'thinking',
    levels: [
      {
        level: 1,
        label: "Embraces change",
        description:
          "Embraces change and puts it into action in own work",
        meaning:
          "Embraces change and puts it into action in own work",
        points: 10,
      },
      {
        level: 2,
        label: "Uses creativity and innovation",
        description:
          "Uses creativity and innovation as part of daily work, identifying new ideas and approaches that others may have missed",
        meaning:
          "Uses creativity and innovation as part of daily work, identifying new ideas and approaches that others may have missed",
        points: 20,
      },
      {
        level: 3,
        label: "Produces new ideas",
        description:
          "Produces new ideas, approaches or insights, creating innovative solutions for customers and colleagues",
        meaning:
          "Produces new ideas, approaches or insights, creating innovative solutions for customers and colleagues",
        points: 30,
      },
      {
        level: 4,
        label: "Improves services",
        description:
          "Improves service delivery by identifying new ideas and approaches that will have a positive impact on customers and/or colleagues",
        meaning:
          "Improves service delivery by identifying new ideas and approaches that will have a positive impact on customers and/or colleagues",
        points: 40,
      },
      {
        level: 5,
        label: "Develops change initiatives",
        description:
          "Devises and implements effective change initiatives, questioning traditional assumptions with radical thinking that is rooted in solid business fundamentals",
        meaning:
          "Devises and implements effective change initiatives, questioning traditional assumptions with radical thinking that is rooted in solid business fundamentals",
        points: 50,
      },
      {
        level: 6,
        label: "Effects transformational change",
        description:
          "Develops and implements strategic and transformational change across a service, with a long-term impact on service delivery",
        meaning:
          "Develops and implements strategic and transformational change across a service, with a long-term impact on service delivery",
        points: 60,
      },
    ],
  },
  {
    id: 'responsibility-and-ownership',
    number: 9,
    name: "Responsibility & Ownership",
    shortName: "Responsibility & Ownership",
    cornerstone: 'delivery',
    levels: [
      {
        level: 1,
        label: "Supporting service delivery",
        description:
          "Supports service delivery with a range of practical tasks.",
        meaning:
          "Puts the customer first by supporting service delivery with a range of practical tasks.",
        points: 30,
      },
      {
        level: 2,
        label: "Delivers services to customers and colleagues",
        description:
          "Delivers a service to customers or colleagues, with responsibility for a sub-set of processes, which are part of a larger process.",
        meaning:
          "Puts the customer first, owning and delivering a prompt, efficient and personalised service to customers",
        points: 60,
      },
      {
        level: 3,
        label: "Owns end-to-end processes to deliver services",
        description:
          "Responsible for owning and delivering an end to end process of some complexity. Plans work over the life cycle of the process.",
        meaning:
          "Puts the customer first by owning the delivery of in-depth end-to-end processes. Plans work over the life cycle of the process.",
        points: 90,
      },
      {
        level: 4,
        label: "Manages teams and resources to deliver services",
        description:
          "Manages teams and resources to deliver services. This will include planning and managing one or more of the following: projects, processes, people, financial resources.",
        meaning:
          "Puts the customer first by planning and managing projects, processes, teams, financial resources to deliver an excellent service to customers and/or colleagues",
        points: 120,
      },
      {
        level: 5,
        label: "Manages complex resources to deliver services",
        description:
          "Manages complex resources to deliver services. This will include planning and managing one or more of the following: complex projects, processes, people, financial resources, over a life cycle of at least a year.",
        meaning:
          "Puts the customer first by planning, resourcing and managing complex projects, processes, teams, financial resources over a cycle of at least a year to deliver an excellent service to customers",
        points: 150,
      },
      {
        level: 6,
        label: "Operationalises business plans to deliver services",
        description:
          "Operationalises business plans and/or strategy by turning them into deliverable operational plans for their area.",
        meaning:
          "Puts the customer first by interpreting business plans into workable plans for their business area",
        points: 180,
      },
      {
        level: 7,
        label: "Translates strategy into business plans",
        description:
          "Translates the strategic direction set by the Board into strategies for a large, high-risk or complex part of the business.",
        meaning:
          "Puts the customer first by translating business goals into strategic plans for a large, high-risk or complex part of the business",
        points: 210,
      },
    ],
  },
  {
    id: 'decision-making',
    number: 10,
    name: "Decision-Making",
    shortName: "Decision-Making",
    cornerstone: 'delivery',
    levels: [
      {
        level: 1,
        label: "Makes straight-forward choices",
        description:
          "Chooses between a small number of existing alternatives",
        meaning:
          "Chooses between a small number of existing alternatives",
        points: 30,
      },
      {
        level: 2,
        label: "Uses straight-forward judgement",
        description:
          "Makes straight-forward decisions, based on judgement, within policy guidelines",
        meaning:
          "Makes straight-forward decisions, based on judgement, within policy guidelines",
        points: 60,
      },
      {
        level: 3,
        label: "Uses judgement using a range of facts",
        description:
          "Makes logical, rational and well-reasoned judgements, based on a range of facts, to come to a decision within policy guidelines",
        meaning:
          "Makes logical, rational and well-reasoned judgements, based on a range of facts, to come to a decision within policy guidelines",
        points: 90,
      },
      {
        level: 4,
        label: "Makes decisions using professional judgement",
        description:
          "Makes decisions about complex customer and/or colleague issues, which include areas that might be ambiguous or outside written policy, based on professional judgement and experience.",
        meaning:
          "Makes decisions about complex customer and/or colleague issues, which include areas that might be ambiguous or outside written policy, based on professional judgement and experience.",
        points: 120,
      },
      {
        level: 5,
        label: "Makes operational decisions for a team",
        description:
          "Makes operational decisions that have an impact on service delivery within a team",
        meaning:
          "Makes operational decisions that have an impact on service delivery within a team",
        points: 150,
      },
      {
        level: 6,
        label: "Makes complex decisions for a business area",
        description:
          "Makes complex decisions that have a long-term impact on service delivery for a business area or across the organisation",
        meaning:
          "Makes complex decisions that have a long-term impact on service delivery for a business area or across the organisation",
        points: 180,
      },
      {
        level: 7,
        label: "Makes complex decisions with an impact across the business",
        description:
          "Makes complex decisions with an high element of organisational risk, that will have a long-term impact on service delivery across the business",
        meaning:
          "Makes complex decisions with an high element of organisational risk, that will have a long-term impact on service delivery across the business",
        points: 210,
      },
    ],
  },
  {
    id: 'context-and-impact',
    number: 11,
    name: "Context & Impact",
    shortName: "Context & Impact",
    cornerstone: 'delivery',
    levels: [
      {
        level: 1,
        label: "Straight-forward context",
        description:
          "Role operates within a straight-forward environment. Impact of role is on immediate area and mistakes are easily identified",
        meaning:
          "Role operates within a straight-forward environment. Impact of role is on immediate area and mistakes are easily identified",
        points: 30,
      },
      {
        level: 2,
        label: "Some complexity to role context",
        description:
          "Role operates in an environment with some complexity but limited to own area of work. Impact of role is on customers and colleagues directly related to role. Mistakes are generally identified speedily.",
        meaning:
          "Role operates in an environment with some complexity but limited to own area of work. Impact of role is on customers and colleagues directly related to role. Mistakes are generally identified speedily.",
        points: 60,
      },
      {
        level: 3,
        label: "Complex context within own work area",
        description:
          "Role operates in an environment that is complex but limited to own area of work. Impact of role is on customer and colleagues directly related to role. Mistakes may not be identified for a period of time.",
        meaning:
          "Role operates in an environment that is complex but limited to own area of work. Impact of role is on customer and colleagues directly related to role. Mistakes may not be identified for a period of time.",
        points: 90,
      },
      {
        level: 4,
        label: "Complex and broad context",
        description:
          "Role operates in an environment that is complex and broad. Impact of role stretches beyond own functional area and/or to a broad customer base. Mistakes may not be identified for a period of time.",
        meaning:
          "Role operates in an environment that is complex and broad. Impact of role stretches beyond own functional area and/or to a broad customer base. Mistakes may not be identified for a period of time.",
        points: 120,
      },
      {
        level: 5,
        label: "Highly complex context",
        description:
          "Role operates in an environment that is highly complex, often ambiguous and changes frequently. Impact of role stretches across the business and/or to a significant and diverse customer base. Mistakes may have service and/or business wide impact",
        meaning:
          "Role operates in an environment that is highly complex, often ambiguous and changes frequently. Impact of role stretches across the business and/or to a significant and diverse customer base. Mistakes may have service and/or business wide impact",
        points: 150,
      },
      {
        level: 6,
        label: "Highly complex and high risk context",
        description:
          "Role operates in an environment, that is highly complex, of high risk to the organisation, with high levels of ambiguity and challenge. Impact of role stretches across organisation as a whole. Mistakes may have political and/or business wide impact.",
        meaning:
          "Role operates in an environment, that is highly complex, of high risk to the organisation, with high levels of ambiguity and challenge. Impact of role stretches across organisation as a whole. Mistakes may have political and/or business wide impact.",
        points: 180,
      },
    ],
  },
]

export const FACTORS_BY_ID: Record<string, SchemeFactor> = Object.fromEntries(
  FACTORS.map((f) => [f.id, f]),
)

/** Highest score the scheme can produce (1645). */
export const MAX_POINTS = FACTORS.reduce(
  (t, f) => t + Math.max(...f.levels.map((l) => l.points)),
  0,
)

/** Lowest score the scheme can produce (240) - every factor must be scored. */
export const MIN_POINTS = FACTORS.reduce(
  (t, f) => t + Math.min(...f.levels.map((l) => l.points)),
  0,
)

/** Maximum points available within each cornerstone, for weighting displays. */
export const CORNERSTONE_MAX: Record<CornerstoneKey, number> = CORNERSTONES.reduce(
  (acc, c) => {
    acc[c.key] = FACTORS.filter((f) => f.cornerstone === c.key).reduce(
      (t, f) => t + Math.max(...f.levels.map((l) => l.points)),
      0,
    )
    return acc
  },
  {} as Record<CornerstoneKey, number>,
)
