
import os, re

template_dir = r'a:\burhani hardware and machinery\BURHANI\BurhaniApp\templates'

for root, dirs, files in os.walk(template_dir):
    for file in files:
        if not file.endswith('.html'): continue
        path = os.path.join(root, file)
        with open(path, 'r', encoding='utf-8') as f: content = f.read()
        
        match = re.search(r'<nav class="bottom-app-bar">(.*?)</nav>', content, re.DOTALL)
        if match:
            nav = match.group(1)
            items = re.findall(r'<a href=.*?</a>', nav, re.DOTALL)
            if len(items) == 4:
                home = next((i for i in items if 'Home' in i or 'bi-house' in i), None)
                cart = next((i for i in items if 'Cart' in i or 'bi-cart' in i), None)
                orders = next((i for i in items if 'Orders' in i or 'bi-box-seam' in i), None)
                menu = next((i for i in items if 'Menu' in i or 'bi-person' in i), None)
                
                if home and cart and orders and menu:
                    new_inner = f'\n        {menu}\n        {home}\n        {orders}\n        {cart}\n    '
                    new_nav = match.group(0).replace(nav, new_inner)
                    content = content.replace(match.group(0), new_nav)
                    with open(path, 'w', encoding='utf-8') as f: f.write(content)
                    print(f'Updated {file}')

