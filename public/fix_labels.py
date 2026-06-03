import os
from bs4 import BeautifulSoup

def process_html_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()

    soup = BeautifulSoup(html, 'html.parser')
    changed = False

    # Find all labels that do not have a 'for' attribute
    for label in soup.find_all('label', for_=False):
        # Skip labels that wrap inputs
        if label.find(['input', 'textarea', 'select']):
            continue

        # Look for sibling or next sibling in parent (assuming structure is <div class="form-group"><label></label><input></div>)
        parent = label.parent
        if parent:
            target = parent.find(['input', 'textarea', 'select'], id=True)
            if target:
                label['for'] = target['id']
                changed = True

    if changed:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(str(soup))
        print(f"Updated {filepath}")

for filename in os.listdir('.'):
    if filename.endswith('.html'):
        process_html_file(filename)
