import assert from 'node:assert/strict';
import {generatePayPeriods,periodPlan,debtPayoff,netWorth,affordabilityPlan,financialSnapshot,vehicleDecision,housingDecision,incomeChangeDecision,overtimeDecision,bonusAllocationDecision,refinanceDecision,whatIfDecision,occurrencesBetween,parseDate,dateString} from '../src/engine.js';
import {estimatePaycheck,federalWithholding2026} from '../src/tax-engine.js';

const state={profile:{nextPayDate:'2026-09-04',payFrequency:'biweekly',emergencyFundTarget:10000},settings:{includeInvestmentsInPlan:true,includeGoalsInPlan:true,debtStrategy:'avalanche',extraDebtPayment:200},income:[{name:'Pay',amount:2500,startDate:'2026-09-04',frequency:'biweekly',active:true}],bills:[{name:'Rent',amount:1500,startDate:'2026-09-05',frequency:'monthly',active:true}],investments:[{name:'TSP',contribution:200,startDate:'2026-09-04',frequency:'biweekly',active:true,currentBalance:10000}],goals:[{name:'EF',autoContribution:100,active:true}],accounts:[{type:'Savings',balance:15000,includeNetWorth:true}],debts:[{name:'Card',balance:5000,apr:20,minimum:150},{name:'Loan',balance:10000,apr:7,minimum:250}],budgets:[{category:'Groceries',monthlyLimit:500}],transactions:[]};
const p=generatePayPeriods(state,1)[0],plan=periodPlan(state,p);
assert.equal(plan.income,2500);assert.equal(plan.bills,1500);assert.equal(plan.investments,200);assert.equal(plan.goals,100);assert.ok(Math.abs(plan.debtPayments-(400*12/26))<0.01);assert.ok(Math.abs(plan.available-(2500-1500-200-100-400*12/26))<0.01);
assert.equal(netWorth(state).net,10000);
const payoff=debtPayoff(state);assert.equal(payoff.complete,true);assert.ok(payoff.months>0&&payoff.months<60);assert.ok(payoff.interest>0);


const pub15t=federalWithholding2026({grossPay:4000,frequency:'biweekly',filingStatus:'single'});
assert.ok(Math.abs(pub15t.withholding-540.3846153846)<0.01,'2026 Pub 15-T standard single biweekly calculation');
const pub15tStep2=federalWithholding2026({grossPay:4000,frequency:'biweekly',filingStatus:'single',w4Step2Checked:true});
assert.ok(pub15tStep2.withholding>pub15t.withholding,'W-4 Step 2 checkbox raises withholding in this scenario');
const pub15tCredits=federalWithholding2026({grossPay:4000,frequency:'biweekly',filingStatus:'single',w4Credits:2600,w4AdditionalWithholding:25});
assert.ok(Math.abs(pub15tCredits.withholding-(pub15t.withholding-100+25))<0.01,'W-4 Step 3 and 4(c) adjustments apply per pay period');

const tax=estimatePaycheck({grossPay:4000,frequency:'biweekly',filingStatus:'single',state:'MD',county:'Montgomery County',preTaxDeductions:200,postTaxDeductions:50});
assert.equal(tax.taxYear,2026);assert.equal(tax.federalMethod,'irs-pub-15t-2026-automated-percentage');assert.ok(tax.federalPerPay>0);assert.ok(tax.socialPerPay>0);assert.ok(tax.medicarePerPay>0);assert.ok(tax.statePerPay>0);assert.ok(tax.localPerPay>0);assert.ok(tax.takeHome>0&&tax.takeHome<4000);
const capped=estimatePaycheck({grossPay:10000,frequency:'monthly',filingStatus:'single',state:'TX',socialSecurityWagesYTD:184000});
assert.ok(Math.abs(capped.socialPerPay-31)<0.001,'Social Security withholding stops at the 2026 wage base');
const addMed=estimatePaycheck({grossPay:5000,frequency:'monthly',filingStatus:'single',state:'TX',medicareWagesYTD:199000});
assert.ok(addMed.medicarePerPay>5000*0.0145,'Additional Medicare withholding begins after $200k employer threshold');
const calibrated=estimatePaycheck({grossPay:4000,frequency:'biweekly',filingStatus:'single',state:'TX',paystubActualTakeHome:3000});
assert.ok(calibrated.calibration&&calibrated.calibration.absoluteDifference>=0,'Pay-stub calibration is reported');

const anneLocal=estimatePaycheck({grossPay:3000,frequency:'biweekly',filingStatus:'single',state:'MD',county:'Anne Arundel County'});
assert.ok(Math.abs(anneLocal.localPerPay-(78000*0.0294/26))<0.01,'Anne Arundel 2026 local tier selects one rate for full taxable income');
const frederickLocal=estimatePaycheck({grossPay:3000,frequency:'biweekly',filingStatus:'single',state:'MD',county:'Frederick County'});
assert.ok(Math.abs(frederickLocal.localPerPay-(78000*0.0296/26))<0.01,'Frederick 2026 local tier selects one rate for full taxable income');

const purchase=affordabilityPlan(state,{price:2500,downPayment:0,apr:8,termMonths:12});
assert.equal(purchase.price,2500);assert.ok(purchase.monthlyIncome>0);assert.ok(purchase.payment>0);assert.ok(purchase.totalFinancedCost>=2500);


const snap=financialSnapshot(state);assert.ok(snap.income>0);assert.equal(snap.debtBalance,15000);
const car=vehicleDecision(state,{price:20000,downPayment:5000,tradeIn:0,apr:6,termMonths:60,insuranceMonthly:120,fuelMonthly:120,maintenanceMonthly:60});assert.ok(car.payment>0);assert.ok(car.ownershipMonthly>car.payment);assert.ok(['comfortable','tight','wait'].includes(car.recommendation));
const rent=housingDecision(state,{mode:'rent',rent:1200,utilities:200,insuranceMonthly:20});assert.equal(rent.housing,1420);assert.ok(rent.ratio>0);
const home=housingDecision(state,{mode:'buy',homePrice:250000,downPayment:50000,apr:6,termYears:30,propertyTaxAnnual:3000,insuranceAnnual:1200,hoaMonthly:0});assert.ok(home.mortgage>0);assert.ok(home.housing>home.mortgage);
const incomeChange=incomeChangeDecision(state,{newMonthlyNet:6000});assert.ok(incomeChange.delta>0);assert.equal(incomeChange.impact,'improves');
const overtime=overtimeDecision(state,{targetAmount:5000,months:6,netHourly:30});assert.ok(overtime.feasible);assert.ok(overtime.hoursPerMonth>=0);
const bonus=bonusAllocationDecision(state,{bonusNet:5000});assert.ok(bonus.allocations.length>0);assert.ok(Math.abs(bonus.allocations.reduce((x,a)=>x+a.amount,0)-5000)<0.01);
const refi=refinanceDecision({balance:10000,currentApr:12,currentMonths:36,newApr:6,newMonths:36,fees:100});assert.ok(refi.currentPayment>refi.newPayment);assert.ok(refi.savings>0);
const wi=whatIfDecision(state,{incomeDelta:500,billDelta:100,debtDelta:50,investDelta:0,goalDelta:0});assert.equal(Math.round((wi.monthlyChange)*100)/100,350);


// Release-hardening regressions.
const semiState={profile:{nextPayDate:'2026-09-01',payFrequency:'semimonthly'},settings:{includeInvestmentsInPlan:false,includeGoalsInPlan:false},income:[],bills:[],investments:[],goals:[]};
const semi=generatePayPeriods(semiState,4).map(x=>x.payDate.toISOString().slice(0,10));
assert.deepEqual(semi,['2026-09-01','2026-09-15','2026-10-01','2026-10-15'],'Semimonthly 1st/15th schedules do not drift by 15-day increments');
const semiEom={...semiState,profile:{nextPayDate:'2026-09-15',payFrequency:'semimonthly'}};
assert.deepEqual(generatePayPeriods(semiEom,4).map(x=>x.payDate.toISOString().slice(0,10)),['2026-09-15','2026-09-30','2026-10-15','2026-10-31'],'Semimonthly 15th/end-of-month schedules respect month length');

const committed=financialSnapshot(state);
assert.equal(committed.committed.debtMinimums,400);
assert.ok(Math.abs(committed.committed.total-2550)<0.01,'Monthly commitments include bills, investing, goals, and debt minimum payments');
assert.ok(Math.abs(committed.free-(2500*26/12-2550-500-200))<0.01);

const impossibleDebt={profile:{},settings:{debtStrategy:'avalanche',extraDebtPayment:0},debts:[{name:'No payment',balance:1000,apr:20,minimum:0}]};
const stuck=debtPayoff(impossibleDebt);
assert.equal(stuck.complete,false,'Debt payoff does not claim completion when there is no payment budget');
assert.equal(stuck.debtFree,'');

const housingReplacement={...state,bills:[{name:'Current rent',amount:1500,startDate:'2026-09-05',frequency:'monthly',category:'Housing',active:true}]};
const replacement=housingDecision(housingReplacement,{mode:'rent',rent:1600,utilities:200,insuranceMonthly:20});
assert.equal(replacement.currentHousingReplaced,1500);
assert.ok(replacement.freeAfter > financialSnapshot(housingReplacement).free-1820,'Housing analysis replaces the current housing payment instead of double-counting it');

// Calendar-anchor regressions: short months must not permanently move monthly/annual dates.
const monthEndItem={startDate:'2027-01-31',frequency:'monthly',active:true};
const monthEndDates=occurrencesBetween(monthEndItem,parseDate('2027-01-01'),parseDate('2027-04-30')).map(dateString);
assert.deepEqual(monthEndDates,['2027-01-31','2027-02-28','2027-03-31','2027-04-30'],'Monthly recurrence preserves the original day-of-month anchor across short months');
const leapItem={startDate:'2024-02-29',frequency:'annual',active:true};
const leapDates=occurrencesBetween(leapItem,parseDate('2024-01-01'),parseDate('2028-12-31')).map(dateString);
assert.deepEqual(leapDates,['2024-02-29','2025-02-28','2026-02-28','2027-02-28','2028-02-29'],'Annual leap-day recurrence returns to Feb 29 in leap years');
const monthlyPayState={profile:{nextPayDate:'2027-01-31',payFrequency:'monthly'},settings:{},income:[],bills:[],investments:[],goals:[],debts:[]};
assert.deepEqual(generatePayPeriods(monthlyPayState,4).map(x=>dateString(x.payDate)),['2027-01-31','2027-02-28','2027-03-31','2027-04-30'],'Monthly pay periods preserve the original payday anchor');

console.log('OpenBudget engine, tax, affordability, and Decision Center tests passed');
