import os
import glob
import re

html_files = glob.glob(r'a:\burhani hardware and machinery\BURHANI\BurhaniApp\templates\*.html')

replacement = '''        <div class="alert alert-{% if message.tags == 'error' %}danger{% elif message.tags == 'warning' %}warning{% elif message.tags == 'success' %}success{% elif message.tags == 'info' %}info{% else %}primary{% endif %} alert-dismissible fade show" role="alert">
            <i class="bi {% if message.tags == 'error' %}bi-exclamation-octagon{% elif message.tags == 'warning' %}bi-exclamation-triangle{% elif message.tags == 'success' %}bi-check-circle{% else %}bi-info-circle{% endif %} me-2"></i>
            {{ message }}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>'''

pattern = re.compile(
    r'<div class="alert alert-\{% if message.tags == \'error\' %\}danger\{% else %\}success\{% endif %\}[^>]*>.*?\{\{ message \}\}.*?</button>\s*</div>',
    re.DOTALL | re.IGNORECASE
)

for f in html_files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    if '{% for message in messages %}' in content:
        new_content, num_replacements = pattern.subn(replacement, content)
        if num_replacements > 0:
            with open(f, 'w', encoding='utf-8') as file:
                file.write(new_content)
            print(f'Updated messages block in {os.path.basename(f)}')
