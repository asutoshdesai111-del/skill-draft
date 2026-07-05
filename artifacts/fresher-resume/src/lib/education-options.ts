export interface EducationProgram {
  degree: string;
  fields: string[];
}

export const EDUCATION_PROGRAMS: EducationProgram[] = [
  { degree: "10th (Secondary / SSC)", fields: ["General"] },
  { degree: "12th (Higher Secondary / HSC)", fields: [
    "Science (PCM)", "Science (PCB)", "Science (PCMB)", "Commerce", "Arts / Humanities", "Vocational",
  ] },
  { degree: "Diploma (Polytechnic)", fields: [
    "Civil Engineering", "Mechanical Engineering", "Electrical Engineering", "Electronics Engineering",
    "Computer Engineering", "Computer Science & Engineering", "Information Technology", "Chemical Engineering",
    "Automobile Engineering", "Instrumentation Engineering", "Mining Engineering", "Textile Engineering",
    "Architecture Assistantship", "Pharmacy", "Hotel Management", "Fashion Design",
  ] },
  { degree: "ITI (Industrial Training)", fields: [
    "Electrician", "Fitter", "Welder", "Mechanic (Motor Vehicle)", "Turner", "Machinist",
    "COPA (Computer Operator & Programming Assistant)", "Plumber", "Draughtsman (Civil)",
    "Draughtsman (Mechanical)", "Wireman", "Instrument Mechanic",
  ] },
  { degree: "B.Tech / B.E. (Bachelor of Technology/Engineering)", fields: [
    "Computer Science & Engineering", "Computer Science & Engineering (AI & ML)", "Information Technology",
    "Electronics & Communication Engineering", "Electrical Engineering", "Electrical & Electronics Engineering",
    "Mechanical Engineering", "Civil Engineering", "Chemical Engineering", "Aerospace Engineering",
    "Automobile Engineering", "Biotechnology", "Industrial Engineering", "Production Engineering",
    "Mining Engineering", "Metallurgical Engineering", "Textile Engineering", "Agricultural Engineering",
    "Marine Engineering", "Petroleum Engineering", "Instrumentation Engineering", "Robotics & Automation",
    "Artificial Intelligence & Data Science", "Data Science", "Mechatronics Engineering",
    "Environmental Engineering", "Biomedical Engineering", "Computer Engineering", "Software Engineering",
  ] },
  { degree: "B.Sc. (Bachelor of Science)", fields: [
    "Physics", "Chemistry", "Mathematics", "Biology", "Zoology", "Botany", "Computer Science",
    "Information Technology", "Statistics", "Biotechnology", "Microbiology", "Electronics", "Agriculture",
    "Nursing", "Home Science", "Environmental Science", "Forensic Science", "Nutrition & Dietetics",
    "Geology", "Psychology", "Biochemistry", "Genetics", "Food Technology", "Fashion & Apparel Design",
    "Animation & Multimedia",
  ] },
  { degree: "B.Com. (Bachelor of Commerce)", fields: [
    "General", "Accounting & Finance", "Banking & Insurance", "Honours", "Computer Applications",
    "Taxation", "E-Commerce", "Financial Markets", "Cost Management",
  ] },
  { degree: "B.A. (Bachelor of Arts)", fields: [
    "English", "History", "Political Science", "Economics", "Sociology", "Psychology", "Philosophy",
    "Geography", "Hindi", "Sanskrit", "Public Administration", "Journalism & Mass Communication",
    "Fine Arts", "Music", "Social Work", "Anthropology", "Education",
  ] },
  { degree: "BBA (Bachelor of Business Administration)", fields: [
    "General Management", "Marketing", "Finance", "Human Resource Management", "International Business",
    "Business Analytics", "Retail Management", "Logistics & Supply Chain", "Banking & Insurance", "Entrepreneurship",
  ] },
  { degree: "BCA (Bachelor of Computer Applications)", fields: [
    "Computer Applications", "Software Development", "Data Science", "Networking & Cybersecurity",
    "Cloud Computing", "Artificial Intelligence",
  ] },
  { degree: "B.Arch. (Bachelor of Architecture)", fields: ["Architecture"] },
  { degree: "B.Pharm. (Bachelor of Pharmacy)", fields: ["Pharmacy", "Pharmaceutical Sciences"] },
  { degree: "LLB (Bachelor of Laws)", fields: ["Law"] },
  { degree: "BA LLB / BBA LLB (Integrated Law)", fields: ["Law"] },
  { degree: "MBBS (Bachelor of Medicine, Bachelor of Surgery)", fields: ["Medicine"] },
  { degree: "BDS (Bachelor of Dental Surgery)", fields: ["Dental Surgery"] },
  { degree: "BHM / BHMCT (Hotel Management)", fields: ["Hotel Management & Catering Technology"] },
  { degree: "B.Ed. (Bachelor of Education)", fields: ["Education"] },
  { degree: "BFA (Bachelor of Fine Arts)", fields: [
    "Painting", "Sculpture", "Applied Arts", "Visual Communication",
  ] },
  { degree: "B.Des. (Bachelor of Design)", fields: [
    "Fashion Design", "Graphic Design", "Interior Design", "Product Design", "UX/UI Design",
    "Textile Design", "Communication Design",
  ] },
  { degree: "B.Voc. (Bachelor of Vocation)", fields: [
    "Software Development", "Retail Management", "Banking Operations", "Food Processing",
  ] },
  { degree: "BPT (Bachelor of Physiotherapy)", fields: ["Physiotherapy"] },
  { degree: "B.Sc. Nursing", fields: ["Nursing"] },
  { degree: "M.Tech / M.E. (Master of Technology/Engineering)", fields: [
    "Computer Science & Engineering", "Information Technology", "VLSI Design", "Structural Engineering",
    "Thermal Engineering", "Power Systems", "Electronics & Communication", "Software Engineering",
    "Data Science", "Artificial Intelligence & Machine Learning", "Cyber Security", "Robotics",
    "Environmental Engineering", "Biotechnology", "Manufacturing Engineering", "Construction Management",
    "Geotechnical Engineering", "Embedded Systems",
  ] },
  { degree: "M.Sc. (Master of Science)", fields: [
    "Physics", "Chemistry", "Mathematics", "Biology", "Computer Science", "Information Technology",
    "Statistics", "Biotechnology", "Data Science", "Environmental Science", "Microbiology", "Psychology",
    "Applied Mathematics", "Actuarial Science", "Forensic Science", "Biochemistry",
  ] },
  { degree: "M.Com. (Master of Commerce)", fields: [
    "General", "Accounting & Finance", "Banking & Insurance", "Business Administration",
  ] },
  { degree: "M.A. (Master of Arts)", fields: [
    "English", "History", "Political Science", "Economics", "Sociology", "Psychology",
    "Public Administration", "Journalism & Mass Communication", "Education",
  ] },
  { degree: "MBA (Master of Business Administration)", fields: [
    "Marketing", "Finance", "Human Resource Management", "Operations Management", "Information Technology",
    "International Business", "Business Analytics", "Supply Chain Management", "Healthcare Management",
    "Rural Management", "Entrepreneurship", "Banking & Finance", "General Management",
  ] },
  { degree: "MCA (Master of Computer Applications)", fields: [
    "Computer Applications", "Software Development", "Data Science", "Artificial Intelligence",
    "Cyber Security", "Cloud Computing",
  ] },
  { degree: "LLM (Master of Laws)", fields: [
    "Corporate Law", "Criminal Law", "Constitutional Law", "Intellectual Property Law", "International Law",
  ] },
  { degree: "MD / MS (Doctor of Medicine / Master of Surgery)", fields: [
    "General Medicine", "Surgery", "Pediatrics", "Gynaecology", "Orthopedics", "Radiology", "Anesthesia",
    "Dermatology", "Psychiatry", "Ophthalmology", "ENT",
  ] },
  { degree: "M.Arch. (Master of Architecture)", fields: [
    "Architecture", "Urban Planning", "Landscape Architecture",
  ] },
  { degree: "M.Pharm. (Master of Pharmacy)", fields: [
    "Pharmaceutics", "Pharmacology", "Pharmaceutical Chemistry", "Pharmacy Practice",
  ] },
  { degree: "PGDM (Post Graduate Diploma in Management)", fields: [
    "Marketing", "Finance", "Human Resource Management", "Operations", "Business Analytics", "International Business",
  ] },
  { degree: "M.Ed. (Master of Education)", fields: ["Education"] },
  { degree: "MSW (Master of Social Work)", fields: ["Social Work"] },
  { degree: "M.Des. (Master of Design)", fields: [
    "Fashion Design", "Product Design", "UX/UI Design", "Graphic Design",
  ] },
  { degree: "Ph.D. (Doctor of Philosophy)", fields: [
    "Computer Science", "Physics", "Chemistry", "Mathematics", "Management", "Economics", "English",
    "Engineering", "Biotechnology", "Commerce", "Education", "Social Sciences",
  ] },
];

export const DEGREE_NAMES: string[] = EDUCATION_PROGRAMS.map(p => p.degree);

const ALL_FIELDS: string[] = Array.from(
  new Set(EDUCATION_PROGRAMS.flatMap(p => p.fields))
).sort((a, b) => a.localeCompare(b));

export function getFieldOptions(degree: string | undefined): string[] {
  const match = EDUCATION_PROGRAMS.find(p => p.degree === degree);
  return match ? match.fields : ALL_FIELDS;
}
