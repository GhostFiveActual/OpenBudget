// OpenBudget offline tax data pack.
// Data is intentionally versioned and bundled with the application; the app never fetches tax rules.

export const TAX_DATA_VERSION = '2026.1';
export const TAX_YEAR = 2026;

export const US_STATES = [
  ['AL','Alabama'],['AK','Alaska'],['AZ','Arizona'],['AR','Arkansas'],['CA','California'],['CO','Colorado'],['CT','Connecticut'],['DE','Delaware'],['DC','District of Columbia'],['FL','Florida'],['GA','Georgia'],['HI','Hawaii'],['ID','Idaho'],['IL','Illinois'],['IN','Indiana'],['IA','Iowa'],['KS','Kansas'],['KY','Kentucky'],['LA','Louisiana'],['ME','Maine'],['MD','Maryland'],['MA','Massachusetts'],['MI','Michigan'],['MN','Minnesota'],['MS','Mississippi'],['MO','Missouri'],['MT','Montana'],['NE','Nebraska'],['NV','Nevada'],['NH','New Hampshire'],['NJ','New Jersey'],['NM','New Mexico'],['NY','New York'],['NC','North Carolina'],['ND','North Dakota'],['OH','Ohio'],['OK','Oklahoma'],['OR','Oregon'],['PA','Pennsylvania'],['RI','Rhode Island'],['SC','South Carolina'],['SD','South Dakota'],['TN','Tennessee'],['TX','Texas'],['UT','Utah'],['VT','Vermont'],['VA','Virginia'],['WA','Washington'],['WV','West Virginia'],['WI','Wisconsin'],['WY','Wyoming']
];

// States with no broad individual wage income tax for planning purposes in 2026.
// New Hampshire does not tax wage income; Washington has no wage income tax (capital-gains rules are separate).
export const NO_WAGE_INCOME_TAX_STATES = new Set(['AK','FL','NV','NH','SD','TN','TX','WA','WY']);

// 2026 federal annual brackets used for a planning estimate of income-tax liability.
// Withholding on a real paycheck can differ from annual liability because Form W-4 rules apply.
export const FEDERAL_2026 = {
  standardDeduction: {
    single: 16100,
    married_joint: 32200,
    head_household: 24150
  },
  brackets: {
    single: [
      [12400,0.10],[50400,0.12],[105700,0.22],[201775,0.24],[256225,0.32],[640600,0.35],[Infinity,0.37]
    ],
    married_joint: [
      [24800,0.10],[100800,0.12],[211400,0.22],[403550,0.24],[512450,0.32],[768700,0.35],[Infinity,0.37]
    ],
    head_household: [
      [17700,0.10],[67450,0.12],[105700,0.22],[201750,0.24],[256200,0.32],[640600,0.35],[Infinity,0.37]
    ]
  },
  socialSecurityRate: 0.062,
  socialSecurityWageBase: 184500,
  medicareRate: 0.0145,
  additionalMedicareRate: 0.009,
  additionalMedicareEmployerThreshold: 200000
};

// Maryland 2026 local income-tax rates. Anne Arundel and Frederick use income-tier-selected flat local rates (not marginal brackets).
// Rates are based on Maryland taxable income and residence, not work location.
export const MD_LOCAL_2026 = {
  'Allegany County': {rate:0.0320},
  'Anne Arundel County': {tiered:true, single:[[50000,0.0270],[400000,0.0294],[Infinity,0.0320]], joint:[[75000,0.0270],[480000,0.0294],[Infinity,0.0320]]},
  'Baltimore County': {rate:0.0320},
  'Baltimore City': {rate:0.0320},
  'Calvert County': {rate:0.0320},
  'Caroline County': {rate:0.0320},
  'Carroll County': {rate:0.0303},
  'Cecil County': {rate:0.0274},
  'Charles County': {rate:0.0303},
  'Dorchester County': {rate:0.0330},
  'Frederick County': {tiered:true, single:[[25000,0.0225],[50000,0.0275],[150000,0.0296],[Infinity,0.0320]], joint:[[25000,0.0225],[100000,0.0275],[250000,0.0296],[Infinity,0.0320]]},
  'Garrett County': {rate:0.0265},
  'Harford County': {rate:0.0306},
  'Howard County': {rate:0.0320},
  'Kent County': {rate:0.0330},
  'Montgomery County': {rate:0.0320},
  "Prince George's County": {rate:0.0320},
  "Queen Anne's County": {rate:0.0320},
  "St. Mary's County": {rate:0.0320},
  'Somerset County': {rate:0.0320},
  'Talbot County': {rate:0.0240},
  'Washington County': {rate:0.0295},
  'Wicomico County': {rate:0.0320},
  'Worcester County': {rate:0.0225}
};

// Maryland state tax brackets. This is a simplified annual-liability estimator based on MD taxable income.
export const MD_STATE_2026 = {
  single: [[1000,0.02],[2000,0.03],[3000,0.04],[100000,0.0475],[125000,0.05],[150000,0.0525],[250000,0.055],[500000,0.0575],[1000000,0.0625],[Infinity,0.065]],
  joint: [[1000,0.02],[2000,0.03],[3000,0.04],[150000,0.0475],[175000,0.05],[225000,0.0525],[300000,0.055],[600000,0.0575],[1200000,0.0625],[Infinity,0.065]]
};

// IRS Publication 15-T (2026), Section 1 — Annual Percentage Method tables
// for automated payroll systems. Each row is [lower bound, upper bound, base tax, rate].
export const FEDERAL_WITHHOLDING_2026 = {
  adjustment: { married_joint: 12900, single: 8600, head_household: 8600 },
  standard: {
    married_joint: [[0,19300,0,0],[19300,44100,0,.10],[44100,120100,2480,.12],[120100,230700,11600,.22],[230700,422850,35932,.24],[422850,531750,82048,.32],[531750,788000,116896,.35],[788000,Infinity,206583.50,.37]],
    single: [[0,7500,0,0],[7500,19900,0,.10],[19900,57900,1240,.12],[57900,113200,5800,.22],[113200,209275,17966,.24],[209275,263725,41024,.32],[263725,648100,58448,.35],[648100,Infinity,192979.25,.37]],
    head_household: [[0,15550,0,0],[15550,33250,0,.10],[33250,83000,1770,.12],[83000,121250,7740,.22],[121250,217300,16155,.24],[217300,271750,39207,.32],[271750,656150,56631,.35],[656150,Infinity,191171,.37]]
  },
  step2: {
    married_joint: [[0,16100,0,0],[16100,28500,0,.10],[28500,66500,1240,.12],[66500,121800,5800,.22],[121800,217875,17966,.24],[217875,272325,41024,.32],[272325,400450,58448,.35],[400450,Infinity,103291.75,.37]],
    single: [[0,8050,0,0],[8050,14250,0,.10],[14250,33250,620,.12],[33250,60900,2900,.22],[60900,108938,8983,.24],[108938,136163,20512,.32],[136163,328350,29224,.35],[328350,Infinity,96489.63,.37]],
    head_household: [[0,12075,0,0],[12075,20925,0,.10],[20925,45800,885,.12],[45800,64925,3870,.22],[64925,112950,8077.50,.24],[112950,140175,19603.50,.32],[140175,332375,28315.50,.35],[332375,Infinity,95585.50,.37]]
  }
};
