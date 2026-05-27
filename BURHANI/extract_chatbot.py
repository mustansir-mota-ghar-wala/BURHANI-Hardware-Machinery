import os
import re

base_file = r"BurhaniApp\templates\base.html"

with open(base_file, "r", encoding="utf-8") as f:
    content = f.read()

# Extract CSS
css_pattern = r"(        /\* Chat Widget Styles \*/.*?)(?=        \{% block extra_css %\})"
css_match = re.search(css_pattern, content, re.DOTALL)
css_content = css_match.group(1) if css_match else ""

# Extract HTML
html_pattern = r"(    <!-- Chat Widget -->\n    <div id=\"chatWidget\" class=\"chat-widget d-none\">.*?    </button>\n)"
html_match = re.search(html_pattern, content, re.DOTALL)
html_content = html_match.group(1) if html_match else ""

# Extract JS
js_pattern = r"(        function toggleChat\(\) \{.*?\n        function appendHtmlMessage\(sender, htmlContent\) \{.*?\n        \}\n)"
js_match = re.search(js_pattern, content, re.DOTALL)
js_content = js_match.group(1) if js_match else ""

if not (css_content and html_content and js_content):
    print("Failed to extract all parts.")
else:
    # Write to chatbot_component.html
    comp = f"<style>\n{css_content}</style>\n{html_content}\n<script>\n{js_content}</script>\n"
    with open(r"BurhaniApp\templates\chatbot_component.html", "w", encoding="utf-8") as f:
        f.write(comp)
    
    # Remove from base.html
    new_content = content.replace(css_content, "")
    new_content = new_content.replace(html_content, "")
    new_content = new_content.replace(js_content, "")
    
    # Add include in base.html right before </body>
    new_content = new_content.replace("</body>", "    {% include 'chatbot_component.html' %}\n</body>")
    
    with open(base_file, "w", encoding="utf-8") as f:
        f.write(new_content)
    
    # Now add include to other standalone files
    standalone = ["cart.html", "checkout.html", "login.html", "register.html", "payment_failed.html"]
    for s in standalone:
        s_path = os.path.join(r"BurhaniApp\templates", s)
        if os.path.exists(s_path):
            with open(s_path, "r", encoding="utf-8") as f:
                s_cont = f.read()
            if "{% include 'chatbot_component.html' %}" not in s_cont:
                s_cont = s_cont.replace("</body>", "    {% include 'chatbot_component.html' %}\n</body>")
                with open(s_path, "w", encoding="utf-8") as f:
                    f.write(s_cont)
    
    print("Successfully extracted chatbot and injected everywhere!")
