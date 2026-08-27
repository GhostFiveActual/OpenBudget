export const money = (value, currency = 'USD') => new Intl.NumberFormat(undefined, {
  style: 'currency', currency, maximumFractionDigits: 2
}).format(Number(value || 0));

export function parseDate(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y,m,d] = s.split('-').map(Number);
  const out = new Date(Date.UTC(y,m-1,d));
  return out.getUTCFullYear()===y && out.getUTCMonth()===m-1 && out.getUTCDate()===d ? out : null;
}
export const dateString = d => d ? d.toISOString().slice(0,10) : '';
export function today() { const n=new Date(); return new Date(Date.UTC(n.getFullYear(),n.getMonth(),n.getDate())); }
export function addDays(d,n){ const x=new Date(d); x.setUTCDate(x.getUTCDate()+n); return x; }
export function addMonths(d,n){ const x=new Date(d), day=x.getUTCDate(); x.setUTCDate(1); x.setUTCMonth(x.getUTCMonth()+n); const end=new Date(Date.UTC(x.getUTCFullYear(),x.getUTCMonth()+1,0)).getUTCDate(); x.setUTCDate(Math.min(day,end)); return x; }
export const daysBetween = (a,b) => Math.round((b-a)/86400000);
export const periodsPerYear = f => f==='weekly'?52:f==='biweekly'?26:f==='semimonthly'?24:f==='monthly'?12:f==='quarterly'?4:f==='annual'?1:12;

function semimonthlyMode(anchor) {
  // Most semimonthly payrolls are either 1st/15th or 15th/last-day.
  // Infer the simpler pattern from the user's first entered occurrence.
  return anchor && anchor.getUTCDate() <= 7 ? '1-15' : '15-eom';
}
function advanceSemimonthly(d, mode='15-eom') {
  const y=d.getUTCFullYear(), m=d.getUTCMonth(), day=d.getUTCDate();
  if(mode==='1-15') return day < 15 ? new Date(Date.UTC(y,m,15)) : new Date(Date.UTC(y,m+1,1));
  const eom=new Date(Date.UTC(y,m+1,0));
  return day <= 15 ? eom : new Date(Date.UTC(y,m+1,15));
}
function addAnchoredMonths(d, months, anchor=d) {
  const x=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+months,1));
  const targetDay=anchor.getUTCDate();
  const end=new Date(Date.UTC(x.getUTCFullYear(),x.getUTCMonth()+1,0)).getUTCDate();
  x.setUTCDate(Math.min(targetDay,end));
  return x;
}
function advance(d,freq,semiMode,anchor=d) {
  if (!d || Number.isNaN(d.getTime())) return null;
  if (freq==='weekly') return addDays(d,7);
  if (freq==='biweekly') return addDays(d,14);
  if (freq==='semimonthly') return advanceSemimonthly(d,semiMode);
  // Preserve the user's original calendar-day anchor. A Jan 31 monthly bill may
  // occur on Feb 28/29, but returns to Mar 31 instead of drifting to Mar 28/29.
  if (freq==='monthly') return addAnchoredMonths(d,1,anchor);
  if (freq==='quarterly') return addAnchoredMonths(d,3,anchor);
  if (freq==='annual') return addAnchoredMonths(d,12,anchor);
  return null;
}

export function occurrencesBetween(item,start,end){
  if(!item.startDate) return [];
  let d=parseDate(item.startDate), hardEnd=item.endDate?parseDate(item.endDate):null, out=[], guard=0;
  const semiMode=item.frequency==='semimonthly'?semimonthlyMode(d):null;
  while(d && d<=end && guard++<3000){
    if(d>=start && (!hardEnd || d<=hardEnd)) out.push(new Date(d));
    d=advance(d,item.frequency||'monthly',semiMode,parseDate(item.startDate));
  }
  return out;
}
export function nextOccurrence(item,from=today()){
  if(!item.startDate)return null;
  let d=parseDate(item.startDate), hardEnd=item.endDate?parseDate(item.endDate):null, guard=0;
  if(!d)return null;
  const semiMode=item.frequency==='semimonthly'?semimonthlyMode(d):null;
  while(d<from && guard++<3000){ d=advance(d,item.frequency||'monthly',semiMode,parseDate(item.startDate)); if(!d)return null; }
  return hardEnd && d>hardEnd ? null : d;
}

export function generatePayPeriods(state,count=18){
  if(!state.profile.nextPayDate) return [];
  let pay=parseDate(state.profile.nextPayDate), freq=state.profile.payFrequency||'biweekly', out=[];
  if(!pay)return [];
  const semiMode=freq==='semimonthly'?semimonthlyMode(pay):null;
  for(let i=0;i<Math.max(0,Math.min(120,Number(count)||0));i++){
    const next=advance(pay,freq,semiMode,parseDate(state.profile.nextPayDate)) || addDays(pay,14);
    out.push({id:`${dateString(pay)}-${i}`,payDate:new Date(pay),start:new Date(pay),end:addDays(next,-1)});
    pay=next;
  }
  return out;
}

export function periodPlan(state,p){
  const collect=(items,key)=>items.filter(x=>x.active!==false).flatMap(item=>occurrencesBetween(item,p.start,p.end).map(occurrence=>({...item,occurrence,value:Number(item[key]||0)})));
  const incomeItems=collect(state.income,'amount');
  const billItems=collect(state.bills,'amount');
  const investmentItems=state.settings.includeInvestmentsInPlan?collect(state.investments,'contribution'):[];
  const goalItems=state.settings.includeGoalsInPlan?state.goals.filter(x=>x.active!==false&&Number(x.autoContribution||0)>0).map(x=>({...x,value:Number(x.autoContribution||0)})):[];
  const sum=a=>a.reduce((s,x)=>s+x.value,0);
  const income=sum(incomeItems), bills=sum(billItems), investments=sum(investmentItems), goals=sum(goalItems);
  // Debts do not require a duplicate bill entry. Reserve their monthly minimums evenly
  // across the user's pay schedule so paycheck availability stays conservative.
  const monthlyDebtMinimums=state.debts.reduce((s,d)=>s+Math.max(0,Number(d.minimum||0)),0);
  const debtPayments=monthlyDebtMinimums*12/periodsPerYear(state.profile.payFrequency||'biweekly');
  return {income,bills,investments,goals,debtPayments,available:income-bills-investments-goals-debtPayments,incomeItems,billItems,investmentItems,goalItems};
}

export function monthlyWindow(ref=today()){
  return {start:new Date(Date.UTC(ref.getUTCFullYear(),ref.getUTCMonth(),1)),end:new Date(Date.UTC(ref.getUTCFullYear(),ref.getUTCMonth()+1,0))};
}
export function monthlyActuals(state,ref=today()){
  const {start,end}=monthlyWindow(ref);
  const tx=state.transactions.filter(x=>{const d=parseDate(x.date);return d&&d>=start&&d<=end;});
  const income=tx.filter(x=>x.type==='income').reduce((s,x)=>s+Number(x.amount||0),0);
  const expenses=tx.filter(x=>x.type==='expense').reduce((s,x)=>s+Number(x.amount||0),0);
  return {income,expenses,net:income-expenses,transactions:tx};
}

export function budgetStatus(state,ref=today()){
  const actual=monthlyActuals(state,ref).transactions;
  return state.budgets.map(b=>{
    const spent=actual.filter(t=>t.type==='expense'&&(t.category||'Uncategorized')===b.category).reduce((s,t)=>s+Number(t.amount||0),0);
    const limit=Number(b.monthlyLimit||0), remaining=limit-spent, pct=limit>0?Math.min(999,(spent/limit)*100):0;
    return {...b,spent,remaining,pct};
  });
}

export function netWorth(state){
  const assets=state.accounts.filter(x=>x.includeNetWorth!==false).reduce((s,x)=>s+Number(x.balance||0),0)+state.investments.reduce((s,x)=>s+Number(x.currentBalance||0),0);
  const liabilities=state.debts.reduce((s,x)=>s+Number(x.balance||0),0);
  return {assets,liabilities,net:assets-liabilities};
}

export function investmentProjection(item){
  const principal=Number(item.currentBalance||0), annual=Number(item.expectedReturn||0)/100, years=Math.max(0,Number(item.years||10));
  const multiplier=item.frequency==='weekly'?52/12:item.frequency==='biweekly'?26/12:item.frequency==='quarterly'?1/3:item.frequency==='annual'?1/12:1;
  const contribution=Number(item.contribution||0)*multiplier;
  let bal=principal;
  for(let i=0;i<Math.round(years*12);i++) bal=bal*(1+annual/12)+contribution;
  return bal;
}

export function debtPayoff(state,strategy=state.settings.debtStrategy||'avalanche',extra=Number(state.settings.extraDebtPayment||0)){
  let debts=state.debts.filter(d=>Number(d.balance||0)>0).map(d=>({...d,balance:Number(d.balance),apr:Number(d.apr||0),minimum:Number(d.minimum||0)}));
  const startTotal=debts.reduce((s,d)=>s+d.balance,0);
  const monthlyBudget=debts.reduce((s,d)=>s+d.minimum,0)+Math.max(0,extra);
  let interest=0,months=0;const maxMonths=600;
  while(debts.some(d=>d.balance>0.005)&&months<maxMonths){
    months++;
    debts.forEach(d=>{if(d.balance>0){const i=d.balance*(d.apr/100/12);d.balance+=i;interest+=i;}});
    let pool=monthlyBudget;
    for(const d of debts){
      if(d.balance<=0||pool<=0)continue;
      const pay=Math.min(d.balance,d.minimum,pool);d.balance-=pay;pool-=pay;
    }
    let order=[...debts].filter(d=>d.balance>0);
    order.sort(strategy==='snowball'?(a,b)=>a.balance-b.balance:(a,b)=>b.apr-a.apr);
    for(const d of order){if(pool<=0)break;const pay=Math.min(pool,d.balance);d.balance-=pay;pool-=pay;}
    if(monthlyBudget<=0)break;
  }
  const debtFree=addMonths(today(),months);
  const complete=debts.every(d=>d.balance<=0.005);
  return {startingBalance:startTotal,months,interest,debtFree:complete?dateString(debtFree):'',complete};
}

export function upcomingEvents(state,days=45){
  const start=today(),end=addDays(start,days),events=[];
  for(const b of state.bills.filter(x=>x.active!==false)) for(const d of occurrencesBetween(b,start,end)) events.push({date:dateString(d),type:'bill',name:b.name,amount:Number(b.amount||0),id:b.id});
  for(const i of state.income.filter(x=>x.active!==false)) for(const d of occurrencesBetween(i,start,end)) events.push({date:dateString(d),type:'income',name:i.name,amount:Number(i.amount||0),id:i.id});
  for(const inv of state.investments.filter(x=>x.active!==false)) for(const d of occurrencesBetween(inv,start,end)) events.push({date:dateString(d),type:'investment',name:inv.name,amount:Number(inv.contribution||0),id:inv.id});
  return events.sort((a,b)=>a.date.localeCompare(b.date));
}

export function financialActions(state){
  const actions=[]; const nw=netWorth(state); const periods=generatePayPeriods(state,3); const plans=periods.map(p=>periodPlan(state,p));
  if(!state.profile.nextPayDate) actions.push({level:'high',title:'Add your payday',text:'Pay-period planning cannot start until your next payday is set.',route:'dashboard'});
  if(!state.accounts.length) actions.push({level:'medium',title:'Add your accounts',text:'Add checking, savings, cash, and other balances to calculate net worth.',route:'accounts'});
  const neg=plans.findIndex(x=>x.available<0); if(neg>=0) actions.push({level:'high',title:'A future paycheck is overcommitted',text:`Pay period ${neg+1} is short by ${Math.abs(plans[neg].available).toFixed(2)} before discretionary spending.`,route:'pay-periods'});
  const highDebt=state.debts.filter(d=>Number(d.apr||0)>=10&&Number(d.balance||0)>0); if(highDebt.length) actions.push({level:'high',title:'High-interest debt is costing you',text:`${highDebt.length} debt account${highDebt.length>1?'s have':' has'} an APR of 10% or more.`,route:'debts'});
  const cash=state.accounts.filter(a=>['Checking','Savings','Cash'].includes(a.type)).reduce((s,a)=>s+Number(a.balance||0),0); if(Number(state.profile.emergencyFundTarget||0)>0&&cash<Number(state.profile.emergencyFundTarget)) actions.push({level:'medium',title:'Emergency fund is below target',text:`You are ${(Number(state.profile.emergencyFundTarget)-cash).toFixed(2)} below your cash reserve goal.`,route:'goals'});
  const reminderDays=Math.max(1,Number(state.settings.backupReminderDays||30));
  if(!state.meta.lastBackupAt) actions.push({level:'low',title:'Create your first backup',text:'Export an offline backup so a device failure does not erase your financial history.',route:'settings'});
  else { const last=new Date(state.meta.lastBackupAt); if(Number.isFinite(last.getTime()) && (Date.now()-last.getTime())/86400000>=reminderDays) actions.push({level:'low',title:'Your backup is due',text:`Your last recorded backup is at least ${reminderDays} days old. Export a fresh copy to protected storage.`,route:'settings'}); }
  if(nw.net<0) actions.push({level:'medium',title:'Net worth is negative',text:'That is useful information, not a judgment. Track it over time and prioritize the highest-impact liabilities.',route:'net-worth'});
  return actions.slice(0,8);
}

export function progressiveTax(amount, brackets){
  amount=Math.max(0,Number(amount||0));
  let tax=0,prev=0;
  for(const [cap,rate] of brackets){
    if(amount<=prev)break;
    const slice=Math.min(amount,cap)-prev;
    tax+=Math.max(0,slice)*rate;
    prev=cap;
  }
  return tax;
}

export function monthlyCommitted(state){
  const mult=f=>f==='weekly'?52/12:f==='biweekly'?26/12:f==='semimonthly'?2:f==='quarterly'?1/3:f==='annual'?1/12:1;
  const bills=state.bills.filter(x=>x.active!==false).reduce((s,x)=>s+Number(x.amount||0)*mult(x.frequency),0);
  const investing=state.settings.includeInvestmentsInPlan?state.investments.filter(x=>x.active!==false).reduce((s,x)=>s+Number(x.contribution||0)*mult(x.frequency),0):0;
  const goals=state.settings.includeGoalsInPlan?state.goals.filter(x=>x.active!==false).reduce((s,x)=>s+Number(x.autoContribution||0)*(state.profile.payFrequency==='weekly'?52/12:state.profile.payFrequency==='biweekly'?26/12:state.profile.payFrequency==='semimonthly'?2:1),0):0;
  const debtMinimums=state.debts.reduce((s,x)=>s+Number(x.minimum||0),0);
  return {bills,investing,goals,debtMinimums,total:bills+investing+goals+debtMinimums};
}

export function monthlyNetIncome(state){
  const mult=f=>f==='weekly'?52/12:f==='biweekly'?26/12:f==='semimonthly'?2:f==='quarterly'?1/3:f==='annual'?1/12:1;
  return state.income.filter(x=>x.active!==false).reduce((s,x)=>s+Number(x.amount||0)*mult(x.frequency),0);
}

export function affordabilityPlan(state, item={}){
  const price=Math.max(0,Number(item.price||0));
  const down=Math.max(0,Math.min(price,Number(item.downPayment||0)));
  const apr=Math.max(0,Number(item.apr||0))/100;
  const term=Math.max(1,Math.round(Number(item.termMonths||12)));
  const monthlyIncome=monthlyNetIncome(state);
  const committed=monthlyCommitted(state);
  const actualBudget=state.budgets.reduce((s,b)=>s+Number(b.monthlyLimit||0),0);
  const flexibleReserve=actualBudget || monthlyIncome*0.20;
  const free=Math.max(0,monthlyIncome-committed.total-flexibleReserve-Number(state.settings.extraDebtPayment||0));
  const cash=state.accounts.filter(a=>['Checking','Savings','Cash','Money Market','Credit Union'].includes(a.type)).reduce((s,a)=>s+Number(a.balance||0),0);
  const emergency=Math.max(0,Number(state.profile.emergencyFundTarget||0));
  const safeCash=Math.max(0,cash-emergency);
  const saveMonths=price<=safeCash?0:(free>0?Math.ceil((price-safeCash)/free):Infinity);
  const principal=Math.max(0,price-down);
  const r=apr/12;
  const payment=principal<=0?0:(r===0?principal/term:principal*r/(1-Math.pow(1+r,-term)));
  const currentDebtMonthly=state.debts.reduce((s,d)=>s+Number(d.minimum||0),0);
  const dtiBefore=monthlyIncome>0?currentDebtMonthly/monthlyIncome:1;
  const dtiAfter=monthlyIncome>0?(currentDebtMonthly+payment)/monthlyIncome:1;
  const emergencyProtected=price<=safeCash;
  const financingComfortable=payment<=free*0.5 && dtiAfter<=0.36 && apr<=0.12;
  let recommendation='wait', reason='Build more monthly breathing room before adding this purchase.';
  if(price===0){recommendation='invalid';reason='Enter a purchase price.';}
  else if(emergencyProtected){recommendation='cash';reason='Available cash above your emergency-fund target can cover this purchase without new debt.';}
  else if(Number.isFinite(saveMonths)&&saveMonths<=6){recommendation='save';reason=`Your current plan can fund this purchase in about ${saveMonths} month${saveMonths===1?'':'s'} without financing.`;}
  else if(financingComfortable){recommendation='finance';reason='The estimated payment fits your current cash flow and keeps debt payments within a conservative debt-to-income range.';}
  else if(Number.isFinite(saveMonths)){recommendation='save';reason=`Saving first avoids adding a payment; your estimated timeline is about ${saveMonths} months.`;}
  return {price,down,monthlyIncome,committed,flexibleReserve,free,cash,emergency,safeCash,saveMonths,payment,dtiBefore,dtiAfter,recommendation,reason,totalFinancedCost:payment*term+down,interestCost:Math.max(0,payment*term-principal)};
}


export function financialSnapshot(state){
  const income=monthlyNetIncome(state);
  const committed=monthlyCommitted(state);
  const categoryBudget=state.budgets.reduce((sum,b)=>sum+Number(b.monthlyLimit||0),0);
  const extraDebt=Math.max(0,Number(state.settings.extraDebtPayment||0));
  const free=income-committed.total-categoryBudget-extraDebt;
  const liquidCash=state.accounts.filter(a=>['Checking','Savings','Cash','Money Market','Credit Union'].includes(a.type)).reduce((sum,a)=>sum+Number(a.balance||0),0);
  const emergency=Math.max(0,Number(state.profile.emergencyFundTarget||0));
  const debtBalance=state.debts.reduce((sum,d)=>sum+Number(d.balance||0),0);
  const debtMinimums=state.debts.reduce((sum,d)=>sum+Number(d.minimum||0),0);
  const nw=netWorth(state);
  return {income,committed,categoryBudget,extraDebt,free,liquidCash,emergency,safeCash:Math.max(0,liquidCash-emergency),debtBalance,debtMinimums,netWorth:nw.net};
}

export function loanPayment(principal,aprPercent,months){
  principal=Math.max(0,Number(principal||0)); months=Math.max(1,Math.round(Number(months||1))); const r=Math.max(0,Number(aprPercent||0))/100/12;
  return principal===0?0:(r===0?principal/months:principal*r/(1-Math.pow(1+r,-months)));
}

export function vehicleDecision(state,input={}){
  const snap=financialSnapshot(state), price=Math.max(0,Number(input.price||0)), down=Math.max(0,Number(input.downPayment||0)), trade=Math.max(0,Number(input.tradeIn||0));
  const financed=Math.max(0,price-down-trade), months=Math.max(1,Number(input.termMonths||60)), payment=loanPayment(financed,input.apr||0,months);
  const insurance=Math.max(0,Number(input.insuranceMonthly||0)), fuel=Math.max(0,Number(input.fuelMonthly||0)), maintenance=Math.max(0,Number(input.maintenanceMonthly||0));
  const ownershipMonthly=payment+insurance+fuel+maintenance, freeAfter=snap.free-ownershipMonthly, paymentRatio=snap.income>0?ownershipMonthly/snap.income:1;
  const cashHit=down, reserveAfter=snap.liquidCash-cashHit;
  let recommendation='wait', reason='The vehicle would put too much pressure on your current monthly cash flow.';
  if(price<=0){recommendation='invalid';reason='Enter a vehicle price.';}
  else if(freeAfter>=Math.max(300,snap.income*0.05)&&paymentRatio<=0.15&&reserveAfter>=snap.emergency){recommendation='comfortable';reason='The estimated all-in vehicle cost fits your current cash flow while preserving your emergency reserve.';}
  else if(freeAfter>=0&&paymentRatio<=0.20){recommendation='tight';reason='The vehicle may fit, but it would materially reduce monthly flexibility. A larger down payment, lower price, or shorter wait would improve the plan.';}
  return {snap,price,down,trade,financed,payment,insurance,fuel,maintenance,ownershipMonthly,freeAfter,paymentRatio,reserveAfter,totalLoanCost:payment*months,totalInterest:Math.max(0,payment*months-financed),recommendation,reason};
}

export function housingDecision(state,input={}){
  const snap=financialSnapshot(state), mode=input.mode||'rent';
  // Housing decisions normally replace the user's current housing payment rather than stack on top of it.
  const currentHousing=state.bills.filter(b=>b.active!==false&&b.category==='Housing').reduce((sum,b)=>{
    const f=b.frequency||'monthly', mult=f==='weekly'?52/12:f==='biweekly'?26/12:f==='semimonthly'?2:f==='quarterly'?1/3:f==='annual'?1/12:1;
    return sum+Number(b.amount||0)*mult;
  },0);
  const baselineFree=snap.free+currentHousing;
  if(mode==='rent'){
    const rent=Math.max(0,Number(input.rent||0)), utilities=Math.max(0,Number(input.utilities||0)), renters=Math.max(0,Number(input.insuranceMonthly||0));
    const housing=rent+utilities+renters, ratio=snap.income>0?housing/snap.income:1, freeAfter=baselineFree-housing;
    let recommendation='wait',reason='This housing cost is above what your current budget comfortably supports.';
    if(housing>0&&ratio<=0.30&&freeAfter>=Math.max(200,snap.income*0.05)){recommendation='comfortable';reason='The projected housing cost stays near a conservative share of net income and leaves monthly breathing room.';}
    else if(housing>0&&ratio<=0.40&&freeAfter>=0){recommendation='tight';reason='This housing option may work, but it would leave limited flexibility for surprises and other goals.';}
    return {mode,snap,currentHousingReplaced:currentHousing,housing,ratio,freeAfter,recommendation,reason,rent,utilities,insuranceMonthly:renters};
  }
  const price=Math.max(0,Number(input.homePrice||0)), down=Math.max(0,Number(input.downPayment||0)), principal=Math.max(0,price-down), termYears=Math.max(1,Number(input.termYears||30));
  const mortgage=loanPayment(principal,input.apr||0,termYears*12), propertyTax=Math.max(0,Number(input.propertyTaxAnnual||0))/12, insurance=Math.max(0,Number(input.insuranceAnnual||0))/12, hoa=Math.max(0,Number(input.hoaMonthly||0)), maintenance=Math.max(0,Number(input.maintenanceMonthly||price*0.01/12));
  const housing=mortgage+propertyTax+insurance+hoa+maintenance, ratio=snap.income>0?housing/snap.income:1, freeAfter=baselineFree-housing, reserveAfter=snap.liquidCash-down;
  let recommendation='wait',reason='This home purchase is not yet supported by the current cash-flow and reserve picture.';
  if(price>0&&ratio<=0.32&&freeAfter>=Math.max(300,snap.income*0.05)&&reserveAfter>=snap.emergency){recommendation='comfortable';reason='The estimated ownership cost fits the current cash flow and preserves the emergency reserve after the down payment.';}
  else if(price>0&&ratio<=0.40&&freeAfter>=0&&reserveAfter>=0){recommendation='tight';reason='The home may be possible, but monthly flexibility or post-closing reserves would be thin.';}
  return {mode,snap,currentHousingReplaced:currentHousing,price,down,principal,mortgage,propertyTax,insurance,hoa,maintenance,housing,ratio,freeAfter,reserveAfter,recommendation,reason,totalMortgagePaid:mortgage*termYears*12};
}

export function incomeChangeDecision(state,input={}){
  const snap=financialSnapshot(state), newMonthlyNet=Math.max(0,Number(input.newMonthlyNet||0)), delta=newMonthlyNet-snap.income, newFree=snap.free+delta;
  const annualDelta=delta*12; let impact='neutral',reason='Your monthly plan is essentially unchanged.';
  if(delta>0){impact='improves';reason=`This change adds about ${delta.toFixed(2)} of monthly take-home capacity before you change spending.`;}
  if(delta<0){impact=newFree>=0?'manageable':'shortfall';reason=newFree>=0?`The lower income reduces monthly flexibility by ${Math.abs(delta).toFixed(2)}, but the current plan remains positive.`:`The lower income creates an estimated monthly shortfall of ${Math.abs(newFree).toFixed(2)} unless commitments are reduced.`;}
  return {snap,newMonthlyNet,delta,annualDelta,newFree,impact,reason};
}

export function overtimeDecision(state,input={}){
  const snap=financialSnapshot(state), target=Math.max(0,Number(input.targetAmount||0)), months=Math.max(1,Number(input.months||1)), netHourly=Math.max(0,Number(input.netHourly||0));
  const existingContribution=Math.max(0,snap.free)*months, remaining=Math.max(0,target-existingContribution), totalHours=netHourly>0?remaining/netHourly:Infinity, hoursPerMonth=totalHours/months, hoursPerWeek=hoursPerMonth/4.345;
  return {snap,target,months,netHourly,existingContribution,remaining,totalHours,hoursPerMonth,hoursPerWeek,feasible:Number.isFinite(totalHours)};
}

export function bonusAllocationDecision(state,input={}){
  const snap=financialSnapshot(state); let remaining=Math.max(0,Number(input.bonusNet||0)); const allocations=[];
  const emergencyGap=Math.max(0,snap.emergency-snap.liquidCash); if(remaining>0&&emergencyGap>0){const amount=Math.min(remaining,emergencyGap);allocations.push({bucket:'Emergency fund',amount,reason:'Restore the cash reserve before taking additional risk.'});remaining-=amount;}
  const high=state.debts.filter(d=>Number(d.balance||0)>0&&Number(d.apr||0)>=10).sort((a,b)=>Number(b.apr||0)-Number(a.apr||0));
  for(const d of high){if(remaining<=0)break;const amount=Math.min(remaining,Number(d.balance||0));allocations.push({bucket:`Debt: ${d.name}`,amount,reason:`Reduce ${Number(d.apr||0).toFixed(1)}% APR debt.`});remaining-=amount;}
  const goal=state.goals.filter(g=>g.active!==false&&Number(g.target||0)>Number(g.saved||0)).sort((a,b)=>(a.deadline||'9999').localeCompare(b.deadline||'9999'))[0];
  if(remaining>0&&goal){const gap=Math.max(0,Number(goal.target||0)-Number(goal.saved||0));const amount=Math.min(remaining,gap);allocations.push({bucket:`Goal: ${goal.name}`,amount,reason:'Advance the next underfunded savings goal.'});remaining-=amount;}
  if(remaining>0){allocations.push({bucket:'Invest / long-term savings',amount:remaining,reason:'No higher-priority reserve or high-interest debt need was detected.'});remaining=0;}
  return {snap,bonusNet:Math.max(0,Number(input.bonusNet||0)),allocations};
}

export function refinanceDecision(input={}){
  const balance=Math.max(0,Number(input.balance||0)), currentApr=Math.max(0,Number(input.currentApr||0)), currentMonths=Math.max(1,Number(input.currentMonths||1)), newApr=Math.max(0,Number(input.newApr||0)), newMonths=Math.max(1,Number(input.newMonths||1)), fees=Math.max(0,Number(input.fees||0));
  const currentPayment=loanPayment(balance,currentApr,currentMonths), newPayment=loanPayment(balance,newApr,newMonths), currentTotal=currentPayment*currentMonths, newTotal=newPayment*newMonths+fees, savings=currentTotal-newTotal, monthlyChange=currentPayment-newPayment;
  const breakEven=monthlyChange>0?fees/monthlyChange:Infinity; let recommendation='keep current',reason='The proposed refinance does not reduce total remaining cost.';
  if(savings>0){recommendation='refinance may help';reason=`The proposed terms reduce estimated remaining cost by ${savings.toFixed(2)} before considering taxes or lender-specific details.`;}
  return {balance,currentApr,currentMonths,newApr,newMonths,fees,currentPayment,newPayment,currentTotal,newTotal,savings,monthlyChange,breakEven,recommendation,reason};
}

export function whatIfDecision(state,input={}){
  const snap=financialSnapshot(state), incomeDelta=Number(input.incomeDelta||0), billDelta=Number(input.billDelta||0), debtDelta=Number(input.debtDelta||0), investDelta=Number(input.investDelta||0), goalDelta=Number(input.goalDelta||0);
  const currentFree=snap.free, newFree=currentFree+incomeDelta-billDelta-debtDelta-investDelta-goalDelta, monthlyChange=newFree-currentFree;
  return {snap,currentFree,newFree,monthlyChange,incomeDelta,billDelta,debtDelta,investDelta,goalDelta,status:newFree>=0?'positive':'shortfall'};
}
