// Hardcoded pool of plausible Hong Kong patient names. Each new WhatsApp number
// that onboards is given the next name from this list (with a randomly chosen
// clinical mock profile). Mostly Cantonese/Chinese — accurate for HK's elderly
// population (~92% ethnic Chinese) — plus a handful of HK's real minorities
// (South Asian, Filipino, Western) for diversity. ~100 names.

export const MOCK_NAMES: string[] = [
  "Mrs. Cheung", "Mr. Wong", "Ms. Lai", "Mr. Yuen", "Mrs. Tsang",
  "Mr. Ng", "Mdm. Tang", "Mr. Chow", "Mrs. Yip", "Mr. Lau",
  "Ms. Leung", "Mr. Cheng", "Mrs. Kwok", "Mr. Tam", "Mdm. Fung",
  "Mr. Choi", "Mrs. Kong", "Ms. Au", "Mr. Sin", "Mrs. Tse",
  "Mr. Pang", "Mdm. Hui", "Mr. Shum", "Mrs. Lo", "Ms. Ip",
  "Mr. Yu", "Mrs. Tong", "Mr. Wan", "Mdm. Chu", "Mr. Sze",
  "Mrs. Ma", "Mr. Poon", "Ms. Kwan", "Mr. Cheuk", "Mrs. Hung",
  "Mr. Siu", "Mdm. Chiu", "Mr. Fong", "Mrs. Mok", "Ms. Ko",
  "Mr. Tin", "Mrs. Liu", "Mr. So", "Mdm. Yeung", "Mr. Mak",
  "Mrs. Wu", "Mr. Tsui", "Ms. Lam", "Mr. Ho", "Mdm. Chan",
  "Mr. Lee", "Mrs. Fok", "Mr. Sze-To", "Ms. Tsoi", "Mr. Lui",
  "Mrs. Yam", "Mr. Kwong", "Mdm. Suen", "Mr. Tai", "Mrs. Wai",
  "Mr. Ho-Sang", "Ms. Cheong", "Mr. Mui", "Mrs. Lok", "Mr. Yim",
  "Mdm. Ko", "Mr. Loke", "Mrs. Pun", "Mr. Sit", "Ms. Wong",
  "Mr. Chau", "Mrs. Tsang", "Mr. Yau", "Mdm. Lai", "Mr. Wan-Sze",
  "Mrs. Cheng", "Mr. Fu", "Ms. Lo", "Mr. Hau", "Mdm. Ngai",
  "Mr. Tang", "Mrs. Sham", "Mr. Lung", "Ms. Wo", "Mr. Cho",
  "Mrs. Yan", "Mr. Pak", "Mdm. Sze", "Mr. Hon", "Mrs. Ching",
  // HK minorities — accurate for the city, not for the elderly majority
  "Mr. Singh", "Mrs. Kaur", "Mr. Khan", "Mrs. Santos",
  "Mr. Dela Cruz", "Mrs. Reyes", "Mr. Gurung", "Mr. Ali",
  "Mr. Thompson", "Mrs. O'Brien",
];
