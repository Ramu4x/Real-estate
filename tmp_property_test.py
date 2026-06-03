import json
import urllib.request
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from pathlib import Path

base = 'http://localhost:5003'
login_req = urllib.request.Request(
    base + '/api/auth/login',
    data=json.dumps({'email': 'sellerwizard@example.com', 'password': '123456'}).encode(),
    headers={'Content-Type': 'application/json'},
    method='POST'
)
with urllib.request.urlopen(login_req) as r:
    login = json.load(r)

token = login['token']
msg = MIMEMultipart()
for k, v in {
    'title': 'Verified Seller Test Property',
    'description': 'A' * 600,
    'type': 'villa',
    'purpose': 'sale',
    'price': '2500000',
    'area': '1200',
    'yearBuilt': '2020',
    'bedrooms': '3',
    'bathrooms': '2',
    'furnishing': 'semi-furnished',
    'status': 'available',
    'location': '123 Main Road, Hyderabad',
    'address': '123 Main Road',
    'city': 'Hyderabad',
    'state': 'Telangana',
    'zipCode': '500032',
    'amenities': '["Parking","Gym"]',
    'latitude': '17.3850',
    'longitude': '78.4867'
}.items():
    part = MIMEText(str(v))
    part.add_header('Content-Disposition', 'form-data', name=k)
    msg.attach(part)

file_path = Path('uploads/images-1778864882862-204269076.avif')
part = MIMEBase('image', 'avif')
part.set_payload(file_path.read_bytes())
part.add_header('Content-Disposition', 'form-data', name='images', filename=file_path.name)
part.add_header('Content-Type', 'image/avif')
msg.attach(part)

req = urllib.request.Request(
    base + '/api/properties',
    data=msg.as_bytes(),
    headers={'Authorization': 'Bearer ' + token, 'Content-Type': msg['Content-Type']},
    method='POST'
)
with urllib.request.urlopen(req) as r:
    print('POST', r.status)
    print(r.read().decode())
