"""Exercise the complete AuraFit app in installed Edge with an isolated profile."""
import json
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import sys
from threading import Thread

from playwright.sync_api import sync_playwright, expect

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from app import build


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self,*args):
        pass


def main():
    parser=argparse.ArgumentParser();parser.add_argument('--streamlit-url');args=parser.parse_args()
    build()
    server=ThreadingHTTPServer(('127.0.0.1',0),partial(QuietHandler,directory=str(ROOT)))
    Thread(target=server.serve_forever,daemon=True).start()
    try:
        with sync_playwright() as p:
            browser=p.chromium.launch(channel='msedge',headless=True)
            context=browser.new_context(viewport={'width':1440,'height':1000},timezone_id='America/New_York',accept_downloads=True)
            page=context.new_page();errors=[];page.on('pageerror',lambda error:errors.append(str(error)));page.on('dialog',lambda dialog:dialog.accept())
            page.goto(f'http://127.0.0.1:{server.server_port}')
            expect(page.locator('#navigation')).to_be_visible()
            expect(page.locator('#navigation button')).to_have_count(5)
            expect(page.locator('#main')).to_contain_text('User directory')
            page.select_option('#csv-user-select','AF001')
            def tab(name):page.click(f'#navigation [data-tab="{name}"]')
            tab('fasting');expect(page.locator('#fast-preset option')).to_have_count(4)
            page.select_option('#fast-preset','custom');page.fill('#custom-hours','1');page.locator('#fast-form button').click()
            expect(page.locator('[data-fast-status]')).to_contain_text('FASTING ACTIVE')
            page.wait_for_timeout(1200);assert page.evaluate('fastInfo().elapsed')>=1
            page.select_option('#csv-user-select','AF002');expect(page.locator('#fast-form')).to_be_visible();assert page.evaluate('state.fast') is None
            page.select_option('#csv-user-select','AF001');expect(page.locator('[data-action="end-fast"]')).to_be_visible()
            page.reload();tab('fasting');expect(page.locator('[data-action="end-fast"]')).to_be_visible()
            page.click('[data-action="end-fast"]');expect(page.locator('.ledger')).to_contain_text('Ended early');assert page.evaluate('state.xp')==340
            page.select_option('#fast-preset','custom');page.fill('#custom-hours','1');page.locator('#fast-form button').click()
            page.evaluate('state.fast.start=Date.now()-3601500;persist();tick()');expect(page.locator('[data-fast-percent]')).to_have_text('100%')
            page.click('[data-action="end-fast"]');assert page.evaluate('state.xp')==440;expect(page.locator('.ledger')).to_contain_text('Completed')
            tab('rewards');page.click('[data-reward="coffee"]');assert page.evaluate('state.xp')==340;expect(page.locator('[data-reward="coffee"]')).to_be_disabled();expect(page.locator('[data-reward="champion"]')).to_be_disabled()
            tab('logger');page.locator('#log-form button').click();assert page.evaluate('state.xp')==350
            page.locator('#log-form button').click();assert page.evaluate('state.xp')==350
            page.select_option('#log-type','meal');page.fill('#log-label','Browser test meal');page.fill('#log-amount','400');page.locator('#log-form button').click()
            page.select_option('#log-type','activity');page.fill('#log-label','Browser test walk');page.fill('#log-amount','30');page.locator('#log-form button').click()
            assert page.evaluate('state.logs.length')==4
            page.select_option('#log-filter','water');expect(page.locator('[data-delete-log]')).to_have_count(2)
            page.locator('[data-delete-log]').first.click();expect(page.locator('[data-delete-log]')).to_have_count(1)
            tab('profile');page.fill('#profile-name','Alex Updated');page.fill('#water-goal','2250');page.fill('#profile-fast','18');page.locator('#profile-form button').click();assert page.evaluate('state.profile.fastPreset')==18
            with page.expect_download() as downloaded:page.click('[data-action="export"]')
            exported=json.loads(Path(downloaded.value.path()).read_text());assert exported['profile']['name']=='Alex Updated'
            tab('logger');page.select_option('#csv-user-select','AF002');assert page.evaluate('state.xp')==120;assert page.evaluate('state.logs.length')==0
            page.locator('#log-form button').click();assert page.evaluate('state.xp')==120
            page.select_option('#csv-user-select','AF001');assert page.evaluate('state.xp')==350;assert page.evaluate('state.profile.name')=='Alex Updated'
            for name in ['obsidian','ocean','forest','rose','amber','daylight']:
                page.select_option('#theme-select',name);assert page.evaluate('document.documentElement.dataset.theme')==name
                assert page.locator('#theme-select option').first.evaluate('(el)=>getComputedStyle(el).color')=='rgb(23, 32, 51)'
            page.fill('#chat-input','Show STATS');page.locator('#chat-form button').click();expect(page.locator('#chat-log')).to_contain_text('Alex Updated')
            page.click('#motivation');page.click('#coach-toggle');expect(page.locator('#coach-toggle')).to_have_attribute('aria-expanded','false');page.click('#coach-toggle')
            tab('dashboard');expect(page.locator('#main')).to_contain_text('Alex Updated')
            page.select_option('#app-view','user');expect(page.locator('#main')).not_to_contain_text('User directory');expect(page.locator('#navigation button')).to_have_count(5)
            for name in ['fasting','logger','rewards','profile','dashboard']:tab(name);expect(page.locator('#main')).to_be_visible()
            page.select_option('#app-view','owner');tab('dashboard')
            original=(ROOT/'data/users.csv').read_bytes();page.set_input_files('#csv-file',{'name':'users.csv','mimeType':'text/csv','buffer':original})
            expect(page.locator('.csv-source')).to_contain_text('Imported users.csv');assert page.evaluate('state.profile.name')=='Alex Updated';assert page.evaluate('state.claimed.includes("coffee")')
            before=page.evaluate('state.xp');page.set_input_files('#csv-file',{'name':'invalid.csv','mimeType':'text/csv','buffer':b'bad'});expect(page.locator('#toast')).to_contain_text('Import rejected');assert page.evaluate('state.xp')==before
            changed=original.replace(b'340,840',b'500,1000');page.set_input_files('#csv-file',{'name':'changed.csv','mimeType':'text/csv','buffer':changed});expect(page.locator('.csv-source')).to_contain_text('Imported changed.csv');assert page.evaluate('state.xp')==510;assert page.evaluate('state.logs.length')==3;assert page.evaluate('state.profile.name')=='Alex Updated'
            with page.expect_download() as downloaded:page.click('#download-csv')
            assert b'500,1000' in Path(downloaded.value.path()).read_bytes()
            # Refreshing the original source rebases XP while retaining new journal/reward data.
            page.reload();page.select_option('#csv-user-select','AF001');tab('logger');assert page.evaluate('state.xp')==350;assert page.evaluate('state.logs.length')==3
            page.set_viewport_size({'width':390,'height':844});tab('profile');expect(page.locator('#profile-form')).to_be_visible();expect(page.locator('#navigation button')).to_have_count(5)
            page.select_option('#csv-user-select','AF002');page.click('[data-action="reset"]');assert page.evaluate('state.logs.length')==0;page.select_option('#csv-user-select','AF001');assert page.evaluate('state.logs.length')==3
            if args.streamlit_url:
                host=context.new_page();host.on('pageerror',lambda error:errors.append(str(error)));host.goto(args.streamlit_url)
                frame=host.frame_locator('iframe[title="AuraFit interactive app with owner and user views"]')
                expect(frame.locator('#navigation button')).to_have_count(5,timeout=30000)
                for role in ['owner','user']:
                    frame.locator('#app-view').select_option(role)
                    for name in ['dashboard','fasting','logger','rewards','profile']:
                        frame.locator(f'#navigation [data-tab="{name}"]').click()
                        expect(frame.locator('#main')).to_be_visible()
                        if name!='dashboard':expect(frame.locator('#main h1')).to_have_text({'fasting':'Fasting Engine','logger':'Daily Logger','rewards':'Rewards Shop','profile':'Your Profile'}[name])
                        elif role=='owner':expect(frame.locator('#main')).to_contain_text('User directory')
                        else:expect(frame.locator('#main')).to_contain_text('Your fasting window')
                frame.locator('#theme-select').select_option('ocean');frame.locator('#chat-input').fill('motivation');frame.locator('#chat-form button').click()
                try:
                    expect(frame.locator('#chat-log .bubble')).not_to_have_count(0)
                except AssertionError:
                    print('CHAT DIAGNOSTIC:',frame.locator('#chat-log').evaluate('(el)=>({html:el.innerHTML,key:coachContextKey,messages:[...coachConversations.entries()]})'))
                    print('BROWSER ERRORS:',errors)
                    raise
                print('PASS: real Streamlit browser iframe — all five tabs in both views, theme selector, and chat.')
            assert not errors,errors
            browser.close()
            print('PASS: real Edge browser — all five tabs in both views, live timers and XP, reload recovery, logs/filter/delete, reward locks, per-user isolation, profile/export/reset, six readable themes, chat, CSV import/export/rebase, mobile navigation, no JavaScript errors.')
    finally:
        server.shutdown();server.server_close()


if __name__=='__main__':main()
