import { FEDERAL_2026, FEDERAL_WITHHOLDING_2026, MD_STATE_2026, MD_LOCAL_2026, NO_WAGE_INCOME_TAX_STATES, TAX_DATA_VERSION, TAX_YEAR } from './tax-data.js';
import { progressiveTax } from './engine.js';

export function payPeriodsPerYear(freq){
  return freq==='weekly'?52:freq==='biweekly'?26:freq==='semimonthly'?24:freq==='monthly'?12:12;
}

function bracketAmount(amount, rows){
  amount=Math.max(0,Number(amount||0));
  const row=rows.find(([lo,hi])=>amount>=lo&&amount<hi) || rows[rows.length-1];
  const [lo,,base,rate]=row;
  return base + Math.max(0,amount-lo)*rate;
}

export function federalWithholding2026(input={}){
  const gross=Math.max(0,Number(input.grossPay||0));
  const periods=payPeriodsPerYear(input.frequency||'biweekly');
  const status=input.filingStatus||'single';
  const pretaxFederal=Math.max(0,Number(input.preTaxFederalDeductions ?? input.preTaxDeductions ?? 0));
  const taxableWages=Math.max(0,gross-pretaxFederal);
  const annualized=taxableWages*periods;
  const step4a=Math.max(0,Number(input.w4OtherIncome ?? input.annualOtherIncome ?? 0));
  const step4b=Math.max(0,Number(input.w4Deductions||0));
  const step3=Math.max(0,Number(input.w4Credits ?? input.annualCredits ?? 0));
  const step4c=Math.max(0,Number(input.w4AdditionalWithholding ?? input.additionalWithholding ?? 0));
  const step2=Boolean(input.w4Step2Checked);
  const adjustment=step2?0:(FEDERAL_WITHHOLDING_2026.adjustment[status] ?? 8600);
  const adjustedAnnual=Math.max(0,annualized+step4a-step4b-adjustment);
  const schedules=step2?FEDERAL_WITHHOLDING_2026.step2:FEDERAL_WITHHOLDING_2026.standard;
  const tentativeAnnual=bracketAmount(adjustedAnnual,schedules[status]||schedules.single);
  const tentativePerPay=tentativeAnnual/periods;
  const creditPerPay=step3/periods;
  const withholding=Math.max(0,tentativePerPay-creditPerPay)+step4c;
  return {withholding, taxableWages, annualized, adjustedAnnual, tentativeAnnual, creditPerPay, step2, method:'irs-pub-15t-2026-automated-percentage'};
}

function mdLocalTax(annualTaxable, county, filingStatus){
  const rule=MD_LOCAL_2026[county];
  if(!rule)return 0;
  if(rule.rate!=null)return annualTaxable*rule.rate;
  // Anne Arundel and Frederick publish tiered local rates: the taxpayer's
  // taxable-income band selects one rate that applies to the full local taxable
  // income. These are not marginal brackets like the Maryland state schedule.
  const joint=['married_joint','head_household'].includes(filingStatus);
  const tiers=joint?rule.joint:rule.single;
  const tier=tiers.find(([cap])=>annualTaxable<=cap)||tiers[tiers.length-1];
  return annualTaxable*Number(tier?.[1]||0);
}

export function estimatePaycheck(input={}){
  const gross=Math.max(0,Number(input.grossPay||0));
  const frequency=input.frequency||'biweekly';
  const periods=payPeriodsPerYear(frequency);
  const status=input.filingStatus||'single';
  const preTax=Math.max(0,Number(input.preTaxFederalDeductions ?? input.preTaxDeductions ?? 0));
  const preTaxFica=Math.max(0,Number(input.preTaxFicaDeductions||0));
  const postTax=Math.max(0,Number(input.postTaxDeductions||0));

  const federal=federalWithholding2026({...input,grossPay:gross,frequency,filingStatus:status});
  const federalPerPay=federal.withholding;

  // FICA is computed per paycheck using YTD wage-base inputs when available.
  const ficaWages=Math.max(0,gross-preTaxFica);
  const ssYtd=Math.max(0,Number(input.socialSecurityWagesYTD||0));
  const ssRemaining=Math.max(0,FEDERAL_2026.socialSecurityWageBase-ssYtd);
  const socialTaxable=Math.min(ficaWages,ssRemaining);
  const socialPerPay=socialTaxable*FEDERAL_2026.socialSecurityRate;
  const medicareYtd=Math.max(0,Number(input.medicareWagesYTD||0));
  const medicareBase=ficaWages*FEDERAL_2026.medicareRate;
  const beforeOver=Math.max(0,FEDERAL_2026.additionalMedicareEmployerThreshold-medicareYtd);
  const additionalMedicareTaxable=Math.max(0,ficaWages-beforeOver);
  const medicarePerPay=medicareBase+additionalMedicareTaxable*FEDERAL_2026.additionalMedicareRate;

  const annualGross=gross*periods;
  const annualPretax=preTax*periods;
  const state=input.state||'';
  const stateTaxable=Math.max(0,annualGross-annualPretax-Math.max(0,Number(input.stateAnnualDeduction||0)));
  let stateAnnual=0,stateMethod='manual-effective-rate';
  if(NO_WAGE_INCOME_TAX_STATES.has(state)){stateAnnual=0;stateMethod='no-broad-wage-income-tax';}
  else if(state==='MD'){
    const bracketKey=['married_joint','head_household'].includes(status)?'joint':'single';
    stateAnnual=progressiveTax(stateTaxable,MD_STATE_2026[bracketKey]);stateMethod='maryland-2026-planning';
  }else stateAnnual=stateTaxable*Math.max(0,Number(input.stateEffectiveRate||0))/100;
  const statePerPay=stateAnnual/periods;

  let localAnnual=0,localMethod='manual-effective-rate';
  if(state==='MD'&&input.county){localAnnual=mdLocalTax(stateTaxable,input.county,status);localMethod='maryland-2026-planning';}
  else localAnnual=stateTaxable*Math.max(0,Number(input.localEffectiveRate||0))/100;
  const localPerPay=localAnnual/periods;

  const taxes=federalPerPay+socialPerPay+medicarePerPay+statePerPay+localPerPay;
  const takeHome=Math.max(0,gross-preTax-taxes-postTax);
  const effectiveTaxRate=gross>0?taxes/gross:0;

  const actualNet=Number(input.paystubActualTakeHome||0);
  const calibration=actualNet>0?{
    actualTakeHome:actualNet,
    difference:takeHome-actualNet,
    absoluteDifference:Math.abs(takeHome-actualNet),
    percentDifference:actualNet?Math.abs(takeHome-actualNet)/actualNet:0
  }:null;

  return {taxYear:TAX_YEAR,dataVersion:TAX_DATA_VERSION,gross,frequency,periods,preTax,preTaxFica,postTax,annualGross,
    federalPerPay,socialPerPay,medicarePerPay,statePerPay,localPerPay,taxes,takeHome,effectiveTaxRate,stateMethod,localMethod,
    stateTaxable,federalTaxable:federal.adjustedAnnual,federalMethod:federal.method,federalDetails:federal,calibration};
}
