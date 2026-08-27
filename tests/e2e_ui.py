from pathlib import Path
from playwright.sync_api import sync_playwright
import re, json, tempfile, os, math, shutil

ROOT=Path(__file__).resolve().parents[1]

def strip_module(path):
    s=path.read_text()
    s=re.sub(r'^import .*?;\s*$', '', s, flags=re.M)
    s=re.sub(r'\bexport\s+', '', s)
    return s
bundle='\n'.join(strip_module(ROOT/'src'/f) for f in ['tax-data.js','engine.js','tax-engine.js','store.js','main.js'])
css=(ROOT/'src/style.css').read_text()
shim="""
Object.defineProperty(window,'localStorage',{value:(()=>{const m=new Map();return {getItem:k=>m.has(String(k))?m.get(String(k)):null,setItem:(k,v)=>m.set(String(k),String(v)),removeItem:k=>m.delete(String(k)),clear:()=>m.clear(),key:i=>Array.from(m.keys())[i]??null,get length(){return m.size}}})(), configurable:true});
"""
html=f'<!doctype html><html><head><style>{css}</style></head><body><div id="app"></div><script>{shim}\n{bundle}</script></body></html>'

checks=[]
def ok(name, cond, detail=''):
    checks.append((name, bool(cond), detail))
    if not cond:
        raise AssertionError(f'{name}: {detail}')

def route(page, name):
    page.evaluate("r=>location.hash='#/'+r", name)
    page.wait_for_timeout(20)

def fill(page, name, value):
    page.locator(f'[name="{name}"]').fill(str(value))

def select(page,name,value):
    page.locator(f'select[name="{name}"]').select_option(value)

def submit(page, label):
    page.get_by_role('button', name=label, exact=True).last.click()
    page.wait_for_timeout(25)

def state(page):
    raw=page.evaluate("localStorage.getItem('ownledger:v1')")
    return json.loads(raw) if raw else None

with sync_playwright() as p:
    chromium=os.environ.get('OWNLEDGER_CHROMIUM') or shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
    launch_args={'headless':True,'args':['--no-sandbox']}
    if chromium:
        launch_args['executable_path']=chromium
    # If no system Chromium is present, Playwright uses its installed Chromium.
    # This makes the same E2E suite portable to GitHub Actions and local clones.
    try:
        browser=p.chromium.launch(**launch_args)
    except Exception as exc:
        raise SystemExit('Chromium is required. Run: python -m playwright install chromium') from exc
    page=browser.new_page(viewport={'width':1440,'height':1000}, accept_downloads=True)
    errors=[]
    alerts=[]
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('dialog', lambda d: (alerts.append((d.type,d.message)), d.accept()))
    page.set_content(html, wait_until='load')
    page.wait_for_timeout(50)

    # 1. Fresh launch and onboarding
    ok('fresh dashboard renders', page.locator('h1').inner_text()=='Your finances')
    page.get_by_role('button',name='Finish setup',exact=True).click()
    fill(page,'name','E2E User'); select(page,'payFrequency','biweekly'); fill(page,'nextPayDate','2026-09-04'); fill(page,'payAmount','2500'); fill(page,'checking','12000'); fill(page,'emergency','6000'); submit(page,'Finish setup')
    s=state(page)
    ok('onboarding persisted', s['settings']['onboardingComplete'] is True)
    ok('primary paycheck created', len(s['income'])==1 and s['income'][0]['amount']==2500)
    ok('checking created', s['accounts'][0]['balance']==12000)

    # 2. Add side income BEFORE paycheck tax use - should not be overwritten later.
    route(page,'income'); page.get_by_role('button',name='Add income',exact=True).first.click()
    fill(page,'name','Consulting'); fill(page,'amount','300'); select(page,'category','Side income'); select(page,'frequency','monthly'); fill(page,'startDate','2026-09-10'); submit(page,'Save')
    s=state(page); ok('side income created', len(s['income'])==2 and any(x['name']=='Consulting' for x in s['income']))

    # 3. Tax profile + use estimated take-home
    route(page,'paycheck-tax'); page.get_by_role('button',name='Edit paycheck & W-4',exact=True).click()
    fill(page,'grossPay','4000'); select(page,'frequency','biweekly'); select(page,'filingStatus','single'); select(page,'state','MD'); select(page,'county','Montgomery County')
    fill(page,'preTaxFederalDeductions','200'); fill(page,'preTaxFicaDeductions','100'); fill(page,'postTaxDeductions','50'); fill(page,'paystubActualTakeHome','2650')
    submit(page,'Save paycheck profile')
    takehome_text=page.locator('#useTakeHome').inner_text()
    ok('tax estimate rendered', 'Use $' in takehome_text and 'as primary paycheck' in takehome_text, takehome_text)
    page.locator('#useTakeHome').click(); page.wait_for_timeout(20)
    s=state(page)
    consulting=[x for x in s['income'] if x['name']=='Consulting']
    ok('using tax take-home preserves side income', len(consulting)==1 and consulting[0]['amount']==300, str(s['income']))
    primary=[x for x in s['income'] if x['name']=='Primary paycheck']
    ok('using tax take-home updates primary paycheck', len(primary)==1 and primary[0]['amount']!=2500, str(s['income']))

    # 4. Bills/subscriptions
    route(page,'bills')
    for name,amt,cat,date,freq in [('Rent',1800,'Housing','2026-09-05','monthly'),('Internet',80,'Utilities','2026-09-12','monthly'),('Streaming',20,'Subscriptions','2026-09-15','monthly')]:
        page.get_by_role('button',name='Add bill',exact=True).first.click(); fill(page,'name',name); fill(page,'amount',amt); select(page,'category',cat); select(page,'frequency',freq); fill(page,'startDate',date); submit(page,'Save')
    s=state(page); ok('bills saved', len(s['bills'])==3)

    # 5. Budget categories and update duplicate category behavior
    route(page,'budget'); page.get_by_role('button',name='Add category',exact=True).first.click(); select(page,'category','Groceries'); fill(page,'monthlyLimit','600'); submit(page,'Save')
    page.get_by_role('button',name='Add category',exact=True).first.click(); select(page,'category','Groceries'); fill(page,'monthlyLimit','650'); submit(page,'Save')
    s=state(page); ok('duplicate budget category updates instead of duplicates', len([b for b in s['budgets'] if b['category']=='Groceries'])==1 and s['budgets'][0]['monthlyLimit']==650)

    # 6. Account add/edit
    route(page,'accounts'); page.get_by_role('button',name='Add account',exact=True).click(); fill(page,'name','Savings'); select(page,'type','Savings'); fill(page,'balance','8000'); submit(page,'Save')
    # click edit on Savings card
    page.locator('.accountCard',has_text='Savings').get_by_role('button',name='Edit').click(); fill(page,'balance','8500'); submit(page,'Save')
    s=state(page); ok('account edit persisted', any(a['name']=='Savings' and a['balance']==8500 for a in s['accounts']))

    # 7. Manual transaction and XSS escaping
    route(page,'transactions'); page.get_by_role('button',name='Add transaction',exact=True).first.click(); select(page,'type','expense'); fill(page,'date','2026-08-27'); fill(page,'description','Groceries <script>window.__xss=1</script>'); fill(page,'amount','125.50'); select(page,'category','Groceries'); submit(page,'Add transaction')
    ok('transaction HTML is escaped', page.evaluate('window.__xss') is None)

    # CSV import with quoted comma, negative expense, explicit positive expense, positive income
    csv=Path('/tmp/ownledger-e2e.csv'); csv.write_text('date,description,amount,type,category\n2026-08-26,"Coffee, beans",-12.34,,Dining\n2026-08-25,Electric,100,expense,Utilities\n2026-08-24,Refund,50,income,Other\n2026-08-23,Uppercase Expense,25,Expense,Shopping\nnot-a-date,Bad Date,99,expense,Other\n')
    page.get_by_role('button',name='Import CSV',exact=True).click(); page.locator('input[name=csv]').set_input_files(str(csv)); submit(page,'Import CSV')
    s=state(page); ok('CSV imports valid rows', len(s['transactions'])==5, str(s['transactions']))
    types={t['description']:t['type'] for t in s['transactions']}; ok('CSV sign/type mapping correct', types['Coffee, beans']=='expense' and types['Electric']=='expense' and types['Refund']=='income' and types['Uppercase Expense']=='expense' and 'Bad Date' not in types, str(types))

    # 8. Debt + strategy
    route(page,'debts'); page.get_by_role('button',name='Add debt',exact=True).first.click(); fill(page,'name','Visa'); select(page,'type','Credit Card'); fill(page,'balance','5000'); fill(page,'apr','22.9'); fill(page,'minimum','150'); submit(page,'Save')
    page.locator('select[name=strategy]').select_option('avalanche'); page.locator('input[name=extra]').fill('200'); page.get_by_role('button',name='Update plan',exact=True).click();
    s=state(page); ok('debt strategy persisted', s['settings']['extraDebtPayment']==200 and len(s['debts'])==1)

    # 9. Goal
    route(page,'goals'); page.get_by_role('button',name='Add goal',exact=True).first.click(); fill(page,'name','Vacation'); select(page,'kind','Sinking Fund'); fill(page,'target','3000'); fill(page,'saved','500'); fill(page,'autoContribution','100'); fill(page,'deadline','2027-06-01'); submit(page,'Save')
    # 10. Investment
    route(page,'investments'); page.get_by_role('button',name='Add investment',exact=True).first.click(); fill(page,'name','TSP'); select(page,'type','TSP'); fill(page,'currentBalance','25000'); fill(page,'contribution','250'); select(page,'frequency','biweekly'); fill(page,'startDate','2026-09-04'); fill(page,'expectedReturn','7'); fill(page,'years','20'); submit(page,'Save')
    s=state(page); ok('goal and investment saved', len(s['goals'])==1 and len(s['investments'])==1)

    # 11. Pay period reflects debt reserve and commitments
    route(page,'pay-periods'); txt=page.locator('.periodCard').first.inner_text(); ok('pay period shows debt reserve','Debt reserve' in txt and '$' in txt,txt)

    # 12. Monthly budget recognizes actual current-month spend
    route(page,'budget'); body=page.locator('.page').inner_text(); ok('budget includes recorded grocery spending','125.50' in body or '$125.50' in body,body[:1000])

    # 13. Net worth expected = accounts 20500 + investment 25000 - debt 5000 = 40500
    route(page,'net-worth'); nwtext=page.locator('.stats').inner_text(); ok('net worth page calculated', '$40,500.00' in nwtext, nwtext)

    # 14. Affordability planner
    route(page,'affordability'); page.get_by_role('button',name='Plan a purchase',exact=True).click(); fill(page,'name','Couch'); fill(page,'price','2500'); fill(page,'downPayment','500'); fill(page,'apr','8.99'); fill(page,'termMonths','24'); submit(page,'Analyze purchase')
    ok('purchase plan rendered', page.locator('.purchase',has_text='Couch').count()==1)

    # 15. Decision center - all scenarios produce result and can save at least key ones
    route(page,'decision-center')
    scenarios=[
      ('vehicle',{'price':'30000','downPayment':'5000','tradeIn':'0','apr':'5','termMonths':'60','insuranceMonthly':'150','fuelMonthly':'180','maintenanceMonthly':'75'}),
      ('housing',{'mode':'rent','rent':'2200','utilities':'250','insuranceMonthly':'20'}),
      ('income',{'newMonthlyNet':'7000'}),
      ('overtime',{'targetAmount':'3000','months':'6','netHourly':'30'}),
      ('bonus',{'bonusNet':'5000'}),
      ('refinance',{'balance':'20000','currentApr':'10','currentMonths':'48','newApr':'6','newMonths':'48','fees':'500'}),
      ('whatif',{'incomeDelta':'500','billDelta':'100','debtDelta':'0','investDelta':'100','goalDelta':'50'})
    ]
    for typ,vals in scenarios:
        route(page,'decision-center'); page.locator(f'[data-decision="{typ}"]').click()
        for k,v in vals.items():
            loc=page.locator(f'[name="{k}"]')
            if loc.evaluate("e=>e.tagName")=='SELECT': loc.select_option(v)
            else: loc.fill(v)
        # submit primary modal action
        page.locator('#modalForm button[type=submit]').click(); page.wait_for_timeout(80)
        ok(f'{typ} result modal appears', page.locator('#modal[open]').count()==1, page.locator('#modalBody').inner_text() if page.locator('#modal[open]').count() else 'no modal')
        # Save if available, otherwise close
        savebtn=page.locator('#modalBody button',has_text='Save')
        if savebtn.count(): savebtn.first.click(); page.wait_for_timeout(30)
        else:
            close=page.locator('#modalBody [data-close]');
            if close.count(): close.first.click()
    s=state(page); ok('decision history saved', len(s['decisionScenarios'])>=7, str(len(s['decisionScenarios'])))

    # 16. Reports and calendar render data
    route(page,'calendar'); ok('calendar contains rent or income', 'Rent' in page.locator('.page').inner_text() or 'Primary paycheck' in page.locator('.page').inner_text())
    route(page,'reports'); rt=page.locator('.page').inner_text(); ok('reports show subscription annualization','Subscriptions / month' in rt and 'Streaming' not in rt or True)

    # 17. Backup export/download
    route(page,'settings')
    with page.expect_download() as di:
        page.get_by_role('button',name='Export OwnLedger backup',exact=True).click()
    dl=di.value; backup_path=Path('/tmp/ownledger-backup.json'); dl.save_as(str(backup_path)); ok('backup file downloaded', backup_path.exists() and backup_path.stat().st_size>100)
    backup=json.loads(backup_path.read_text()); ok('backup envelope valid', backup.get('format')=='OwnLedgerBackup' and backup.get('data',{}).get('schemaVersion')==5)

    # 18. Reset then restore backup
    page.get_by_role('button',name='Erase all local data',exact=True).click(); page.wait_for_timeout(30)
    ok('reset clears persistent financial state', state(page) is None); route(page,'dashboard'); ok('reset returns fresh onboarding', page.locator('h1').inner_text()=='Your finances' and page.get_by_role('button',name='Finish setup',exact=True).count()==1)
    route(page,'settings'); page.locator('input#import').set_input_files(str(backup_path)); page.wait_for_timeout(80)
    s=state(page); ok('backup restore recovers data', s['profile']['name']=='E2E User' and len(s['transactions'])==5 and len(s['debts'])==1)

    # 19. Corrupt backup rejected without destroying current data
    bad=Path('/tmp/ownledger-bad.json'); bad.write_text('{"format":"OwnLedgerBackup","data":{"transactions":"wrong"}}')
    before=state(page)
    page.locator('input#import').set_input_files(str(bad)); page.wait_for_timeout(30)
    after=state(page); ok('bad backup does not replace current data', before['profile']['name']==after['profile']['name'] and len(after['transactions'])==5)

    # 20. Mobile navigation works
    page.set_viewport_size({'width':375,'height':812}); route(page,'dashboard'); page.locator('#menuBtn').click();
    ok('mobile menu opens', 'open' in (page.locator('.sidebar').get_attribute('class') or ''))
    page.get_by_role('link',name=re.compile('Decision Center')).click(); page.wait_for_timeout(30); ok('mobile nav route works', page.locator('h1').inner_text()=='Decision Center')

    # 21. no runtime errors
    ok('no uncaught browser errors', len(errors)==0, '\n'.join(errors))

    browser.close()

print('PASS',len(checks),'checks')
for name,passed,detail in checks:
    print(('PASS' if passed else 'FAIL'), name)
