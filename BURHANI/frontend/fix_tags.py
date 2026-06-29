import re

css_path = r'a:\burhani hardware and machinery\BURHANI\frontend\src\index.css'
with open(css_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace django static tag with direct path
content = re.sub(r'\{%\s*static\s+[\'\"]([^\'\"]+)[\'\"]\s*%\}', r'/static/\1', content)

with open(css_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Replaced django static tags with regular paths.')
